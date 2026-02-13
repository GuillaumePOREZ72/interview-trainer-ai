/**
 * Hook to manage Mock Interview logic
 * Handles interview flow, SSE connection, audio recording, and API calls
 */

import { useState, useRef, useCallback, useEffect } from "react";
import axiosInstance from "../utils/axiosInstance";
import { API_PATHS } from "../utils/apiPaths";
import toast from "react-hot-toast";
import { TFunction } from "i18next";
import {
  MockInterviewSession,
  MockInterviewState,
  MockInterviewError,
  InterviewLanguage,
  StartInterviewRequest,
  StartInterviewResponse,
  SubmitAnswerResponse,
  CompleteInterviewResponse,
  GetSessionResponse,
  SSEEventType,
} from "../types";

export type { MockInterviewState, MockInterviewError };

interface UseMockInterviewReturn {
  // State
  state: MockInterviewState;
  session: MockInterviewSession | null;
  currentQuestion: {
    text: string;
    audioUrl: string | null;
    index: number;
  } | null;
  transcript: string;
  interimTranscript: string;
  isSupported: boolean;
  error: MockInterviewError | null;
  queuePosition: number | null;
  analysisProgress: number;
  
  // Actions
  startInterview: (data: StartInterviewRequest) => Promise<void>;
  startRecording: () => Promise<void>;
  stopRecording: (sessionId?: string) => Promise<void>;
  completeInterview: () => Promise<void>;
  reset: () => void;
  connectToSSE: (sessionId: string) => void;
  
  // Utils
  getFrequencyData: () => Uint8Array;
}

export const useMockInterview = (
  t: TFunction,
  language: InterviewLanguage = "en"
): UseMockInterviewReturn => {
  // Core state
  const [state, setState] = useState<MockInterviewState>("setup");
  const [session, setSession] = useState<MockInterviewSession | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<{
    text: string;
    audioUrl: string | null;
    index: number;
  } | null>(null);
  const [transcript, setTranscript] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");
  const [isSupported, setIsSupported] = useState(true);
  const [error, setError] = useState<MockInterviewError | null>(null);
  const [queuePosition, setQueuePosition] = useState<number | null>(null);
  const [analysisProgress, setAnalysisProgress] = useState(0);

  // Refs for audio recording and analysis
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  
  // Refs for speech recognition
  const recognitionRef = useRef<any>(null);
  
  // Refs for SSE
  const eventSourceRef = useRef<EventSource | null>(null);

  // Check browser support
  useEffect(() => {
    const checkSupport = () => {
      // Check MediaRecorder support
      if (!window.MediaRecorder) {
        setIsSupported(false);
        setError({
          type: "unknown",
          message: t("mockInterview.errors.browserNotSupported"),
          recoverable: false,
        });
        return;
      }

      // Check getUserMedia support
      if (!navigator.mediaDevices?.getUserMedia) {
        setIsSupported(false);
        setError({
          type: "microphone",
          message: t("mockInterview.errors.micNotSupported"),
          recoverable: false,
        });
      }
    };

    checkSupport();
  }, [t]);

  // Initialize Speech Recognition
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = language === "fr" ? "fr-FR" : "en-US";

    recognition.onresult = (event: any) => {
      let finalTranscript = "";
      let currentInterim = "";

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        } else {
          currentInterim += event.results[i][0].transcript;
        }
      }

      if (finalTranscript) {
        setTranscript((prev) => (prev ? prev + " " : "") + finalTranscript);
      }
      setInterimTranscript(currentInterim);
    };

    recognition.onerror = (event: any) => {
      console.error("Speech recognition error:", event.error);
      if (event.error !== "no-speech" && event.error !== "aborted") {
        setError({
          type: "unknown",
          message: t("mockInterview.errors.speechRecognition"),
          recoverable: true,
        });
      }
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [language, t]);

  // Cleanup SSE connection on unmount
  useEffect(() => {
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  /**
   * Start a new interview session
   */
  const startInterview = useCallback(async (data: StartInterviewRequest) => {
    try {
      setError(null);
      setState("connecting");

      const response = await axiosInstance.post<StartInterviewResponse>(
        API_PATHS.MOCK_INTERVIEW.START,
        data
      );

      const { sessionId, question } = response.data;

      // Fetch full session details
      const sessionResponse = await axiosInstance.get<GetSessionResponse>(
        API_PATHS.MOCK_INTERVIEW.GET_SESSION(sessionId)
      );

      setSession(sessionResponse.data.session);
      setCurrentQuestion(question);
      setState("question");
      
      toast.success(t("mockInterview.success.started"));
      
      // Connect to SSE for real-time updates
      connectToSSE(sessionId);
    } catch (err: any) {
      console.error("Failed to start interview:", err);
      setState("setup");
      setError({
        type: "api",
        message: err.response?.data?.message || t("mockInterview.errors.startFailed"),
        recoverable: true,
      });
      toast.error(t("mockInterview.errors.startFailed"));
    }
  }, [t]);

  /**
   * Connect to SSE stream for real-time updates
   */
  const connectToSSE = useCallback((sessionId: string) => {
    // Close existing connection
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    // Get JWT token from localStorage or cookie
    const token = localStorage.getItem('token') || '';
    
    // Build SSE URL with token as query param (EventSource can't send headers)
    const sseUrl = `${API_PATHS.MOCK_INTERVIEW.STREAM(sessionId)}`;
    const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:8000";
    const fullUrl = `${baseUrl}${sseUrl}?token=${encodeURIComponent(token)}`;

    const eventSource = new EventSource(fullUrl);
    eventSourceRef.current = eventSource;

    eventSource.addEventListener("connected", (event) => {
      console.log("SSE connected:", event.data);
    });

    eventSource.addEventListener("status", (event) => {
      const data = JSON.parse(event.data);
      console.log("Status update:", data);
      
      if (data.status === "analyzing") {
        setState("analyzing");
      } else if (data.status === "active") {
        setState("question");
      }
    });

    eventSource.addEventListener("queue", (event) => {
      const data = JSON.parse(event.data);
      setQueuePosition(data.position);
    });

    eventSource.addEventListener("analysis", (event) => {
      const data = JSON.parse(event.data);
      // Analysis complete for a question
      if (session) {
        const updatedQuestions = [...session.questions];
        const questionIndex = updatedQuestions.findIndex(
          (q) => q.questionIndex === data.questionIndex
        );
        if (questionIndex !== -1) {
          updatedQuestions[questionIndex].analysis = data.analysis;
          setSession({ ...session, questions: updatedQuestions });
        }
      }
      setAnalysisProgress(100);
      setQueuePosition(null);
    });

    eventSource.addEventListener("nextQuestion", (event) => {
      const data = JSON.parse(event.data);
      setCurrentQuestion({
        text: data.questionText,
        audioUrl: data.audioUrl || null,
        index: data.questionIndex,
      });
      setTranscript("");
      setInterimTranscript("");
      setAnalysisProgress(0);
      setState("question");
      toast.info(t("mockInterview.info.nextQuestion"));
    });

    eventSource.addEventListener("complete", (event) => {
      const data = JSON.parse(event.data);
      console.log("Interview complete:", data);
      setState("completed");
      toast.success(t("mockInterview.success.completed"));
    });

    eventSource.addEventListener("error", (event) => {
      console.error("SSE error:", event);
      // Don't set error state for heartbeat timeouts
    });

    eventSource.onerror = (error) => {
      console.error("EventSource error:", error);
      if (state !== "completed") {
        setError({
          type: "sse",
          message: t("mockInterview.errors.connectionLost"),
          recoverable: true,
        });
      }
    };
  }, [session, state, t]);

  /**
   * Start recording audio
   */
  const startRecording = useCallback(async () => {
    try {
      setError(null);
      setTranscript("");
      setInterimTranscript("");
      audioChunksRef.current = [];

      // Initialize Web Audio API for visualization
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext ||
          (window as any).webkitAudioContext)();
      }

      if (audioContextRef.current.state === "suspended") {
        await audioContextRef.current.resume();
      }

      // Get microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // Setup audio analysis
      const source = audioContextRef.current.createMediaStreamSource(stream);
      const analyser = audioContextRef.current.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);

      analyserRef.current = analyser;
      sourceRef.current = source;
      dataArrayRef.current = new Uint8Array(analyser.frequencyBinCount);

      // Setup MediaRecorder
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: "audio/webm;codecs=opus",
      });

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start(100); // Collect data every 100ms

      // Start speech recognition
      if (recognitionRef.current) {
        recognitionRef.current.start();
      }

      setState("recording");
    } catch (err) {
      console.error("Failed to start recording:", err);
      setError({
        type: "microphone",
        message: t("mockInterview.errors.micDenied"),
        recoverable: true,
      });
      toast.error(t("mockInterview.errors.micDenied"));
    }
  }, [t]);

  /**
   * Stop recording and submit answer
   */
  const stopRecording = useCallback(async (sessionId?: string) => {
    if (state !== "recording") return;
    
    const currentSessionId = sessionId || session?._id;
    if (!currentSessionId) {
      toast.error("No session available");
      return;
    }

    setState("uploading");

    // Stop MediaRecorder
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
    }

    // Stop speech recognition
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }

    // Stop audio stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
    }

    // Prepare data
    const fullTranscript = (transcript + " " + interimTranscript).trim();

    if (!fullTranscript && audioChunksRef.current.length === 0) {
      setState("question");
      toast.error(t("mockInterview.errors.noSpeech"));
      return;
    }

    try {
      // Create FormData
      const formData = new FormData();
      formData.append("transcript", fullTranscript);

      // Add audio file if available
      if (audioChunksRef.current.length > 0) {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        formData.append("audio", audioBlob, "recording.webm");
      }

      // Submit answer
      await axiosInstance.post<SubmitAnswerResponse>(
        API_PATHS.MOCK_INTERVIEW.ANSWER(currentSessionId),
        formData
      );

      setState("analyzing");
      toast.success(t("mockInterview.success.answerSubmitted"));
    } catch (err: any) {
      console.error("Failed to submit answer:", err);
      setState("question");
      setError({
        type: "api",
        message: err.response?.data?.message || t("mockInterview.errors.submitFailed"),
        recoverable: true,
      });
      toast.error(t("mockInterview.errors.submitFailed"));
    }
  }, [state, session, transcript, interimTranscript, t]);

  /**
   * Complete the interview
   */
  const completeInterview = useCallback(async () => {
    if (!session) return;

    try {
      const response = await axiosInstance.post<CompleteInterviewResponse>(
        API_PATHS.MOCK_INTERVIEW.COMPLETE(session._id)
      );

      setState("completed");
      
      // Update session with report
      setSession((prev) =>
        prev
          ? {
              ...prev,
              status: "completed",
              overallScore: response.data.report.overallScore,
            }
          : null
      );

      toast.success(t("mockInterview.success.completed"));
      return response.data.report;
    } catch (err: any) {
      console.error("Failed to complete interview:", err);
      setError({
        type: "api",
        message: err.response?.data?.message || t("mockInterview.errors.completeFailed"),
        recoverable: true,
      });
      toast.error(t("mockInterview.errors.completeFailed"));
      throw err;
    }
  }, [session, t]);

  /**
   * Reset the hook state
   */
  const reset = useCallback(() => {
    // Cleanup
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
    }
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }

    // Reset state
    setState("setup");
    setSession(null);
    setCurrentQuestion(null);
    setTranscript("");
    setInterimTranscript("");
    setError(null);
    setQueuePosition(null);
    setAnalysisProgress(0);
    audioChunksRef.current = [];
  }, []);

  /**
   * Get audio frequency data for visualization
   */
  const getFrequencyData = useCallback(() => {
    if (analyserRef.current && dataArrayRef.current) {
      analyserRef.current.getByteFrequencyData(dataArrayRef.current);
      return dataArrayRef.current;
    }
    return new Uint8Array(128).fill(0);
  }, []);

  return {
    state,
    session,
    currentQuestion,
    transcript,
    interimTranscript,
    isSupported,
    error,
    queuePosition,
    analysisProgress,
    startInterview,
    startRecording,
    stopRecording,
    completeInterview,
    reset,
    getFrequencyData,
    connectToSSE,
  };
};

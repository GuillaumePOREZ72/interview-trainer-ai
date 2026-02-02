import { useState, useEffect, useRef, useCallback } from "react";
import axiosInstance from "../utils/axiosInstance";
import { API_PATHS } from "../utils/apiPaths";
import toast from "react-hot-toast";

export type VoiceStudioState = "IDLE" | "LISTENING" | "THINKING" | "ERROR";

/**
 * Hook to manage Vocal Interview Simulator logic:
 * - Audio analysis for visualization
 * - Speech Recognition (STT) via Web Speech API
 * - Backend analysis orchestration
 */
export const useVoiceStudio = (questionId: string, language: string = "en") => {
  const [state, setState] = useState<VoiceStudioState>("IDLE");
  const [transcript, setTranscript] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");
  const [isSupported, setIsSupported] = useState(true);

  // Audio Context refs for visualization
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Speech Recognition ref
  const recognitionRef = useRef<any>(null);

  // Initialize Speech Recognition
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setIsSupported(false);
      return;
    }

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
      console.error("Speech recognition error", event.error);
      if (event.error !== "no-speech") {
        setState("ERROR");
        toast.error(`STT Error: ${event.error}`);
      }
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [language]);

  const startListening = async () => {
    try {
      setTranscript("");
      setInterimTranscript("");
      setState("LISTENING");

      // Initialize Web Audio API for visualization
      if (!audioContextRef.current) {
        audioContextRef.current = new (
          window.AudioContext || (window as any).webkitAudioContext
        )();
      }

      if (audioContextRef.current.state === "suspended") {
        await audioContextRef.current.resume();
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const source = audioContextRef.current.createMediaStreamSource(stream);
      const analyser = audioContextRef.current.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);

      analyserRef.current = analyser;
      sourceRef.current = source;
      dataArrayRef.current = new Uint8Array(analyser.frequencyBinCount);

      // Start STT
      recognitionRef.current.start();
    } catch (err) {
      console.error("Failed to start listening:", err);
      setState("ERROR");
      toast.error("Microphone access denied or error occurred.");
    }
  };

  const stopListening = async () => {
    if (state !== "LISTENING") return;

    setState("THINKING");

    // Stop STT
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }

    // Stop Audio Stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
    }

    // Prepare full text
    const fullTranscript = (transcript + " " + interimTranscript).trim();

    if (!fullTranscript) {
      setState("IDLE");
      toast.error("No speech detected.");
      return;
    }

    try {
      // Send to backend for analysis
      const response = await axiosInstance.post(API_PATHS.AI.ANALYZE_VOCAL, {
        questionId,
        transcript: fullTranscript,
        language,
      });

      setState("IDLE");
      toast.success("Analysis complete!");
      return response.data;
    } catch (err) {
      console.error("Analysis failed:", err);
      setState("ERROR");
      toast.error("Failed to analyze your response.");
      throw err;
    }
  };

  const getFrequencyData = useCallback(() => {
    if (analyserRef.current && dataArrayRef.current) {
      analyserRef.current.getByteFrequencyData(dataArrayRef.current);
      return dataArrayRef.current;
    }
    return new Uint8Array(128).fill(0);
  }, []);

  return {
    state,
    transcript,
    interimTranscript,
    isSupported,
    startListening,
    stopListening,
    getFrequencyData,
  };
};

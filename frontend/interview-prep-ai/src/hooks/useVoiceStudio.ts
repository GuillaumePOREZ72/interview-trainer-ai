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
// TFunction type from i18next
import { TFunction } from "i18next";

export const useVoiceStudio = (
  questionId: string,
  language: string = "en",
  t: TFunction,
) => {
  const [state, setState] = useState<VoiceStudioState>("IDLE");
  const [transcript, setTranscript] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");
  const [isSupported, setIsSupported] = useState(true);

  // Audio Context refs for visualization
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const dataArrayRef = useRef<Uint8Array<ArrayBuffer> | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Speech Recognition ref
  const recognitionRef = useRef<any>(null);

  // Initialize Speech Recognition
  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition ||
      window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setIsSupported(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = language === "fr" ? "fr-FR" : "en-US";

    recognition.onresult = (event: Event | any) => {
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

    recognition.onerror = (event: Event | any) => {
      console.error("Speech recognition error", event.error);

      if (event.error === "network") {
        setState("ERROR");
        // Special message for Brave or network issues
        const isBrave = navigator.brave !== undefined;
        const msg = isBrave
          ? t("vocal.errors.brave")
          : t("vocal.errors.network");
        toast.error(msg, { duration: 6000 });
      } else if (event.error !== "no-speech") {
        setState("ERROR");
        toast.error(t("vocal.errors.sttError", { error: event.error }));
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
          window.AudioContext || window.webkitAudioContext
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
      toast.error(t("vocal.errors.micDenied"));
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
      toast.error(t("vocal.errors.noSpeech"));
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
      toast.success(t("vocal.success.analysis"));
      return response.data;
      toast.success(t("vocal.success.analysis"));
      return response.data;
    } catch (err: any) {
      console.error("Analysis failed:", err);
      setState("ERROR");

      if (err.response && err.response.status === 429) {
        toast.error(t("vocal.errors.rateLimit"));
      } else {
        toast.error(t("vocal.errors.analysisFailed"));
      }
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

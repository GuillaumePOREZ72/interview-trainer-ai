import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  LuX,
  LuMic,
  LuMicOff,
  LuMessageSquare,
  LuChevronLeft,
  LuCircleAlert,
} from "react-icons/lu";
import { useVoiceStudio } from "../../hooks/useVoiceStudio";
import VoiceWave from "../../components/vocal/VoiceWave";
import axiosInstance from "../../utils/axiosInstance";
import { API_PATHS } from "../../utils/apiPaths";
import { Question } from "../../types";
import SpinnerLoader from "../../components/loader/SpinnerLoader";
import { useTranslation } from "react-i18next";

const VoiceStudio = () => {
  const { sessionId, questionId } = useParams<{
    sessionId: string;
    questionId: string;
  }>();
  const navigate = useNavigate();
  const [question, setQuestion] = useState<Question | null>(null);
  const [loading, setLoading] = useState(true);
  const { i18n, t } = useTranslation();

  const {
    state,
    transcript,
    interimTranscript,
    isSupported,
    startListening,
    stopListening,
    getFrequencyData,
  } = useVoiceStudio(questionId!, i18n.language, t);

  useEffect(() => {
    const fetchQuestion = async () => {
      if (!sessionId || !questionId) return;

      try {
        const response = await axiosInstance.get(
          API_PATHS.SESSION.GET_ONE(sessionId),
        );
        const session = response.data.session;
        const foundQuestion = session.questions.find(
          (q: { _id: string }) => q._id === questionId,
        );
        setQuestion(foundQuestion);
      } catch (err) {
        console.error("Failed to fetch question:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchQuestion();
  }, [sessionId, questionId]);

  const handleToggleListening = async () => {
    if (state === "IDLE") {
      startListening();
    } else if (state === "LISTENING") {
      try {
        await stopListening();
        // Redirect back to session view to see analysis in context
        setTimeout(() => {
          navigate(`/interview-prep/${sessionId}`);
        }, 1500);
      } catch (err) {
        // Error handled in hook
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50 dark:bg-gray-900">
        <SpinnerLoader />
      </div>
    );
  }

  if (!isSupported) {
    return (
      <div className="flex flex-col items-center justify-center h-screen p-6 text-center bg-gray-50 dark:bg-gray-900">
        <LuCircleAlert className="w-16 h-16 text-amber-500 mb-4" />
        <h2 className="text-2xl font-bold mb-2">Browser Not Supported</h2>
        <p className="text-gray-600 dark:text-gray-400 max-w-md">
          {t("vocal.browserNotSupported.message")}
        </p>
        <button
          onClick={() => navigate(-1)}
          className="mt-6 px-6 py-2 bg-indigo-600 text-white rounded-lg cursor-pointer"
        >
          {t("vocal.browserNotSupported.goBack")}
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col items-center justify-center p-4 md:p-8 relative overflow-hidden font-sans">
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-20">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-500 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-500 blur-[120px] rounded-full" />
      </div>

      {/* Header */}
      <div className="absolute top-8 left-4 right-4 md:left-8 md:right-8 flex justify-between items-center z-10">
        <button
          onClick={() => navigate(-1)}
          className="p-2 hover:bg-black/5 dark:hover:bg-white/10 rounded-full transition-colors cursor-pointer group"
        >
          <LuChevronLeft className="w-6 h-6 text-gray-500 group-hover:text-gray-900 dark:text-gray-400 dark:group-hover:text-white" />
        </button>
        <div className="bg-black/5 dark:bg-white/10 backdrop-blur-md px-4 py-1.5 rounded-full border border-black/5 dark:border-white/10 text-[10px] md:text-xs font-bold text-gray-500 dark:text-gray-400 tracking-[0.2em] uppercase">
          {t("vocal.studioMode")}
        </div>
        <button
          onClick={() => navigate(`/interview-prep/${sessionId}`)}
          className="p-2 hover:bg-black/5 dark:hover:bg-white/10 rounded-full transition-colors cursor-pointer"
        >
          <LuX className="w-6 h-6 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white" />
        </button>
      </div>

      {/* Main Content */}
      <div className="w-full max-w-3xl flex flex-col items-center z-10">
        {/* Question Display */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <span className="inline-block px-3 py-1 bg-indigo-500/10 text-indigo-500 rounded-full text-[10px] font-bold mb-4 border border-indigo-500/20 uppercase tracking-[0.3em]">
            {t("vocal.practiceSession")}
          </span>
          <h1 className="text-2xl md:text-4xl font-bold text-gray-900 dark:text-white leading-tight px-4">
            {question?.question}
          </h1>
        </motion.div>

        {/* Visualization & Controls */}
        <div className="relative flex flex-col items-center w-full mb-12">
          <VoiceWave state={state} getFrequencyData={getFrequencyData} />

          <div className="mt-12 flex flex-col items-center gap-6">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleToggleListening}
              className={`relative w-24 h-24 rounded-full flex items-center justify-center shadow-2xl cursor-pointer transition-all duration-500 ${
                state === "LISTENING"
                  ? "bg-rose-500 shadow-rose-500/40"
                  : "bg-indigo-600 shadow-indigo-600/40"
              }`}
            >
              {state === "LISTENING" ? (
                <LuMicOff className="w-10 h-10 text-white" />
              ) : (
                <LuMic className="w-10 h-10 text-white" />
              )}

              {state === "LISTENING" && (
                <motion.div
                  className="absolute inset-0 rounded-full border-4 border-rose-500"
                  animate={{ scale: [1, 1.4, 1], opacity: [0.5, 0, 0.5] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                />
              )}
            </motion.button>

            <AnimatePresence mode="wait">
              {state === "LISTENING" ? (
                <motion.p
                  key="listening"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-gray-500 dark:text-gray-400 font-bold text-sm tracking-wide animate-pulse"
                >
                  {t("vocal.listening")}
                </motion.p>
              ) : state === "THINKING" ? (
                <motion.div
                  key="thinking"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center gap-3 text-indigo-500 font-bold text-sm tracking-wide"
                >
                  <SpinnerLoader />
                  <span>{t("vocal.analyzing")}</span>
                </motion.div>
              ) : (
                <motion.p
                  key="idle"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-gray-400 dark:text-gray-600 font-bold text-sm tracking-wide text-center"
                >
                  {t("vocal.ready")}
                </motion.p>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Real-time Transcription Display */}
        <AnimatePresence>
          {(transcript || interimTranscript) && (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full bg-white dark:bg-gray-900/30 backdrop-blur-xl border border-gray-200 dark:border-white/5 rounded-[2rem] p-8 shadow-2xl"
            >
              <div className="flex items-center gap-2 mb-6 text-[10px] font-bold text-indigo-500 tracking-[0.2em] uppercase">
                <LuMessageSquare className="w-4 h-4" />
                {t("vocal.liveTranscription")}
              </div>
              <p className="text-lg md:text-xl text-gray-800 dark:text-gray-200 leading-relaxed min-h-[80px]">
                {transcript}
                <span className="text-gray-400 dark:text-gray-600 transition-opacity duration-300">
                  {" "}
                  {interimTranscript}
                </span>
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default VoiceStudio;

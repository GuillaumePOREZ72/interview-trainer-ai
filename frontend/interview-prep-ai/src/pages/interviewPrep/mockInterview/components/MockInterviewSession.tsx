import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import { LuMic, LuMicOff, LuSkipForward, LuStopCircle, LuVolume2, LuLoader } from "react-icons/lu";
import DashboardLayout from "../../../../components/layouts/DashboardLayout";
import VoiceWave from "../../../../components/vocal/VoiceWave";
import SpinnerLoader from "../../../../components/loader/SpinnerLoader";
import axiosInstance from "../../../../utils/axiosInstance";
import { API_PATHS } from "../../../../utils/apiPaths";
import { MockInterviewSession as SessionType } from "../../../../types";
import { useMockInterview } from "../../../../hooks/useMockInterview";

const MockInterviewSession = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  
  const [sessionData, setSessionData] = useState<SessionType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const {
    state,
    currentQuestion,
    transcript,
    interimTranscript,
    isSupported,
    queuePosition,
    startRecording,
    stopRecording,
    completeInterview,
    getFrequencyData,
  } = useMockInterview(t, i18n.language as "fr" | "en");

  // Fetch session data on mount
  useEffect(() => {
    const fetchSession = async () => {
      if (!sessionId) return;
      
      try {
        const response = await axiosInstance.get(
          API_PATHS.MOCK_INTERVIEW.GET_SESSION(sessionId)
        );
        setSessionData(response.data.session);
      } catch (err) {
        setError(t("mockInterview.errors.loadSession"));
      } finally {
        setLoading(false);
      }
    };

    fetchSession();
  }, [sessionId, t]);

  // Handle complete interview
  const handleComplete = async () => {
    try {
      await completeInterview();
      navigate(`/mock-interview/report/${sessionId}`);
    } catch (err) {
      // Error handled in hook
    }
  };

  // Play TTS audio
  const playQuestionAudio = () => {
    if (currentQuestion?.audioUrl) {
      const audio = new Audio(currentQuestion.audioUrl);
      audio.play();
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="min-h-screen bg-bg-primary flex items-center justify-center">
          <SpinnerLoader size="large" />
        </div>
      </DashboardLayout>
    );
  }

  if (error || !sessionData) {
    return (
      <DashboardLayout>
        <div className="min-h-screen bg-bg-primary flex items-center justify-center">
          <div className="text-center">
            <p className="text-danger">{error || t("mockInterview.errors.loadSession")}</p>
            <button
              onClick={() => navigate("/dashboard")}
              className="mt-4 btn-small"
            >
              {t("common.back")}
            </button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const progress = sessionData 
    ? ((sessionData.currentQuestionIndex + 1) / 5) * 100 
    : 0;

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-bg-primary transition-colors duration-300">
        <div className="container mx-auto pt-8 pb-24 px-4 md:px-8 max-w-3xl">
          {/* Progress Bar */}
          <div className="mb-8">
            <div className="flex justify-between text-sm text-text-secondary mb-2">
              <span>{t("mockInterview.session.progress")}</span>
              <span>{sessionData.currentQuestionIndex + 1} / 5</span>
            </div>
            <div className="h-2 bg-bg-tertiary rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-primary to-secondary"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
          </div>

          {/* Question Card */}
          <AnimatePresence mode="wait">
            {(state === "setup" || state === "question") && (
              <motion.div
                key="question"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="bg-bg-secondary rounded-2xl p-8 border border-border-primary mb-8"
              >
                <div className="flex items-start justify-between mb-6">
                  <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium">
                    {t("mockInterview.session.question", { 
                      current: sessionData.currentQuestionIndex + 1,
                      total: 5 
                    })}
                  </span>
                  {currentQuestion?.audioUrl && (
                    <button
                      onClick={playQuestionAudio}
                      className="p-2 rounded-full bg-bg-tertiary hover:bg-primary/20 transition-colors"
                      title={t("mockInterview.session.playAudio")}
                    >
                      <LuVolume2 className="w-5 h-5 text-primary" />
                    </button>
                  )}
                </div>

                <h2 className="text-xl md:text-2xl font-semibold text-text-primary mb-8 leading-relaxed">
                  {(sessionData.questions[sessionData.currentQuestionIndex]?.questionText || currentQuestion?.text || t("mockInterview.session.loadingQuestion")).replace(/<think>.*?<\/think>/gs, '').trim()}
                </h2>

                <div className="flex justify-center">
                  <button
                    onClick={startRecording}
                    className="btn-primary flex items-center gap-3 text-lg px-8 py-4"
                    disabled={!sessionData.questions[sessionData.currentQuestionIndex]?.questionText}
                  >
                    <LuMic className="w-6 h-6" />
                    {t("mockInterview.session.recordButton")}
                  </button>
                </div>
              </motion.div>
            )}

            {state === "recording" && (
              <motion.div
                key="recording"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-bg-secondary rounded-2xl p-8 border border-border-primary mb-8"
              >
                <div className="text-center mb-6">
                  <span className="inline-flex items-center gap-2 px-4 py-2 bg-danger/10 text-danger rounded-full text-sm font-medium animate-pulse">
                    <LuMic className="w-4 h-4" />
                    {t("mockInterview.session.recording")}
                  </span>
                </div>

                <VoiceWave state="LISTENING" getFrequencyData={getFrequencyData} />

                <div className="mt-6 min-h-[100px] p-4 bg-bg-primary rounded-lg border border-border-primary">
                  <p className="text-text-primary">
                    {transcript}
                    <span className="text-text-tertiary">{interimTranscript}</span>
                  </p>
                </div>

                <div className="flex justify-center gap-4 mt-6">
                  <button
                    onClick={() => stopRecording(sessionId)}
                    className="flex items-center gap-2 px-6 py-3 bg-danger text-white rounded-lg hover:bg-danger/90 transition-colors"
                  >
                    <LuStopCircle className="w-5 h-5" />
                    {t("mockInterview.session.stopButton")}
                  </button>
                </div>
              </motion.div>
            )}

            {state === "analyzing" && (
              <motion.div
                key="analyzing"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="bg-bg-secondary rounded-2xl p-8 border border-border-primary mb-8 text-center"
              >
                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-secondary/10 flex items-center justify-center">
                  <LuLoader className="w-10 h-10 text-secondary animate-spin" />
                </div>

                <h3 className="text-xl font-semibold text-text-primary mb-2">
                  {t("mockInterview.session.analyzing")}
                </h3>

                {queuePosition !== null && queuePosition > 0 && (
                  <p className="text-text-secondary">
                    {t("mockInterview.session.queuePosition", { position: queuePosition })}
                  </p>
                )}

                <div className="mt-6 p-4 bg-bg-primary rounded-lg">
                  <p className="text-text-secondary text-sm mb-2">{t("mockInterview.session.yourAnswer")}</p>
                  <p className="text-text-primary">{transcript}</p>
                </div>
              </motion.div>
            )}

            {state === "completed" && (
              <motion.div
                key="completed"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-bg-secondary rounded-2xl p-8 border border-border-primary mb-8 text-center"
              >
                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-success/10 flex items-center justify-center">
                  <span className="text-4xl">🎉</span>
                </div>

                <h3 className="text-2xl font-bold text-text-primary mb-2">
                  {t("mockInterview.session.completed")}
                </h3>
                <p className="text-text-secondary mb-6">
                  {t("mockInterview.session.completedDescription")}
                </p>

                <button
                  onClick={handleComplete}
                  className="btn-primary"
                >
                  {t("mockInterview.session.viewReport")}
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Skip / Complete Options */}
          {state === "question" && (
            <div className="flex justify-between items-center">
              <button
                onClick={() => navigate("/dashboard")}
                className="text-text-tertiary hover:text-text-secondary transition-colors"
              >
                {t("common.cancel")}
              </button>

              {sessionData.currentQuestionIndex >= 4 && (
                <button
                  onClick={handleComplete}
                  className="flex items-center gap-2 text-primary hover:text-secondary transition-colors"
                >
                  {t("mockInterview.session.finishEarly")}
                  <LuSkipForward className="w-4 h-4" />
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default MockInterviewSession;

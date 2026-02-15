import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { LuArrowLeft, LuRotateCcw, LuCircleCheck, LuCircleAlert, LuLightbulb, LuTrendingUp, LuClock } from "react-icons/lu";
import DashboardLayout from "../../../../components/layouts/DashboardLayout";
import SpinnerLoader from "../../../../components/loader/SpinnerLoader";
import axiosInstance from "../../../../utils/axiosInstance";
import { API_PATHS } from "../../../../utils/apiPaths";
import { MockInterviewSession, ResponseAnalysis } from "../../../../types";

const MockInterviewReport = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  
  const [session, setSession] = useState<MockInterviewSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSession = async () => {
      if (!sessionId) {
        setError("No session ID provided");
        setLoading(false);
        return;
      }

      try {
        const response = await axiosInstance.get(
          API_PATHS.MOCK_INTERVIEW.GET_SESSION(sessionId)
        );
        setSession(response.data.session);
      } catch (err: any) {
        console.error("Failed to fetch session:", err);
        setError(err.response?.data?.message || "Failed to load report");
      } finally {
        setLoading(false);
      }
    };

    fetchSession();
  }, [sessionId]);

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-500";
    if (score >= 60) return "text-yellow-500";
    return "text-red-500";
  };

  const getScoreBg = (score: number) => {
    if (score >= 80) return "bg-green-500/10 border-green-500/20";
    if (score >= 60) return "bg-yellow-500/10 border-yellow-500/20";
    return "bg-red-500/10 border-red-500/20";
  };

  const getSentimentIcon = (sentiment: string) => {
    switch (sentiment) {
      case "positive":
        return <LuCircleCheck className="w-5 h-5 text-green-500" />;
      case "negative":
        return <LuCircleAlert className="w-5 h-5 text-red-500" />;
      default:
        return <LuTrendingUp className="w-5 h-5 text-yellow-500" />;
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-[calc(100vh-200px)]">
          <SpinnerLoader size="large" />
        </div>
      </DashboardLayout>
    );
  }

  if (error || !session) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)] space-y-4">
          <div className="text-red-500 text-lg">{error || "Session not found"}</div>
          <button
            onClick={() => navigate("/dashboard")}
            className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            <LuArrowLeft className="w-4 h-4" />
            {t("common.back")}
          </button>
        </div>
      </DashboardLayout>
    );
  }

  const answeredQuestions = session.questions.filter(q => q.userResponse);
  const averageScore = answeredQuestions.length > 0
    ? answeredQuestions.reduce((sum, q) => sum + (q.analysis?.accuracy || 0), 0) / answeredQuestions.length
    : 0;

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto py-8 px-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <button
            onClick={() => navigate("/dashboard")}
            className="flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-4 transition-colors"
          >
            <LuArrowLeft className="w-4 h-4" />
            {t("common.back")}
          </button>
          
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">
            {t("mockInterview.report.title", "Interview Report")}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {session.role} • {session.experience} {t("common.years")} • {answeredQuestions.length} {t("mockInterview.report.questionsAnswered", "questions answered")}
          </p>
        </motion.div>

        {/* Overall Score Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className={`rounded-2xl border-2 p-8 mb-8 ${getScoreBg(session.overallScore || averageScore)}`}
        >
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-1">
                {t("mockInterview.report.overallScore", "Overall Score")}
              </h2>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                {t("mockInterview.report.basedOnAnswers", "Based on your {{count}} answers", { count: answeredQuestions.length })}
              </p>
            </div>
            <div className={`text-6xl font-bold ${getScoreColor(session.overallScore || averageScore)}`}>
              {Math.round(session.overallScore || averageScore)}
              <span className="text-2xl text-gray-400">/100</span>
            </div>
          </div>
        </motion.div>

        {/* Performance Breakdown */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8"
        >
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3 mb-3">
              <LuCircleCheck className="w-5 h-5 text-green-500" />
              <h3 className="font-semibold text-gray-800 dark:text-white">
                {t("mockInterview.report.strengths", "Strengths")}
              </h3>
            </div>
            <ul className="space-y-2">
              {session.strengths?.slice(0, 3).map((strength: string, idx: number) => (
                <li key={idx} className="text-sm text-gray-600 dark:text-gray-400 flex items-start gap-2">
                  <span className="text-green-500 mt-0.5">•</span>
                  {strength}
                </li>
              )) || (
                <li className="text-sm text-gray-400 italic">
                  {t("mockInterview.report.noStrengths", "Complete the interview to see your strengths")}
                </li>
              )}
            </ul>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3 mb-3">
              <LuLightbulb className="w-5 h-5 text-yellow-500" />
              <h3 className="font-semibold text-gray-800 dark:text-white">
                {t("mockInterview.report.improvements", "To Improve")}
              </h3>
            </div>
            <ul className="space-y-2">
              {session.improvementAreas?.slice(0, 3).map((area: string, idx: number) => (
                <li key={idx} className="text-sm text-gray-600 dark:text-gray-400 flex items-start gap-2">
                  <span className="text-yellow-500 mt-0.5">•</span>
                  {area}
                </li>
              )) || (
                <li className="text-sm text-gray-400 italic">
                  {t("mockInterview.report.noImprovements", "Complete the interview to see improvement areas")}
                </li>
              )}
            </ul>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3 mb-3">
              <LuClock className="w-5 h-5 text-blue-500" />
              <h3 className="font-semibold text-gray-800 dark:text-white">
                {t("mockInterview.report.sessionDetails", "Session Details")}
              </h3>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">{t("mockInterview.report.started", "Started")}</span>
                <span className="text-gray-700 dark:text-gray-300">
                  {new Date(session.startedAt).toLocaleDateString()}
                </span>
              </div>
              {session.completedAt && (
                <div className="flex justify-between">
                  <span className="text-gray-500">{t("mockInterview.report.completed", "Completed")}</span>
                  <span className="text-gray-700 dark:text-gray-300">
                    {new Date(session.completedAt).toLocaleDateString()}
                  </span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-500">{t("mockInterview.report.language", "Language")}</span>
                <span className="text-gray-700 dark:text-gray-300 uppercase">{session.language}</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Question Analysis */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-8"
        >
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
            {t("mockInterview.report.questionAnalysis", "Question Analysis")}
          </h2>
          
          <div className="space-y-4">
            {session.questions.map((question, index) => (
              <div
                key={index}
                className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">
                      {t("mockInterview.report.question", "Question")} {index + 1}
                    </span>
                    <p className="text-gray-800 dark:text-white mt-1 font-medium">
                      {question.questionText}
                    </p>
                  </div>
                  {question.analysis && (
                    <div className={`text-2xl font-bold ${getScoreColor(question.analysis.accuracy)} ml-4`}>
                      {question.analysis.accuracy}
                    </div>
                  )}
                </div>

                {question.userResponse ? (
                  <div className="space-y-3">
                    <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                      <p className="text-sm text-gray-500 mb-1">
                        {t("mockInterview.report.yourAnswer", "Your Answer")}
                      </p>
                      <p className="text-gray-700 dark:text-gray-300 text-sm line-clamp-3">
                        {question.userResponse.transcript}
                      </p>
                    </div>

                    {question.analysis && (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
                          <div className="flex items-center gap-2 mb-1">
                            {getSentimentIcon(question.analysis.sentiment)}
                            <span className="text-xs text-gray-500">
                              {t("mockInterview.report.sentiment", "Sentiment")}
                            </span>
                          </div>
                          <p className="text-sm font-medium capitalize text-gray-700 dark:text-gray-300">
                            {question.analysis.sentiment}
                          </p>
                        </div>

                        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
                          <p className="text-xs text-gray-500 mb-1">
                            {t("mockInterview.report.confidence", "Confidence")}
                          </p>
                          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            {question.analysis.confidence}%
                          </p>
                        </div>

                        {question.analysis.fillerWords.length > 0 && (
                          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 col-span-2">
                            <p className="text-xs text-gray-500 mb-1">
                              {t("mockInterview.report.fillerWords", "Filler Words")}
                            </p>
                            <p className="text-sm text-gray-700 dark:text-gray-300">
                              {question.analysis.fillerWords.join(", ")}
                            </p>
                          </div>
                        )}
                      </div>
                    )}

                    {question.analysis?.suggestions && question.analysis.suggestions.length > 0 && (
                      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
                        <p className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">
                          {t("mockInterview.report.suggestions", "Suggestions")}
                        </p>
                        <ul className="space-y-1">
                          {question.analysis.suggestions.map((suggestion, idx) => (
                            <li key={idx} className="text-sm text-blue-700 dark:text-blue-300 flex items-start gap-2">
                              <span className="mt-1">•</span>
                              {suggestion}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-gray-400 italic">
                    {t("mockInterview.report.notAnswered", "Not answered")}
                  </p>
                )}
              </div>
            ))}
          </div>
        </motion.div>

        {/* Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="flex flex-col sm:flex-row gap-4 justify-center"
        >
          <button
            onClick={() => navigate("/mock-interview/setup")}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-500 text-white rounded-xl font-medium hover:bg-blue-600 transition-colors"
          >
            <LuRotateCcw className="w-4 h-4" />
            {t("mockInterview.report.newInterview", "Start New Interview")}
          </button>
          
          <button
            onClick={() => navigate("/dashboard")}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-medium hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
          >
            <LuArrowLeft className="w-4 h-4" />
            {t("mockInterview.report.backToDashboard", "Back to Dashboard")}
          </button>
        </motion.div>
      </div>
    </DashboardLayout>
  );
};

export default MockInterviewReport;

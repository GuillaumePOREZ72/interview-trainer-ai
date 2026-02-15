import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { LuMic, LuCalendar, LuTrendingUp, LuArrowRight, LuHistory, LuTrash2, LuEye } from "react-icons/lu";
import SpinnerLoader from "../../../../components/loader/SpinnerLoader";
import axiosInstance from "../../../../utils/axiosInstance";
import { API_PATHS } from "../../../../utils/apiPaths";
import { MockInterviewSession } from "../../../../types";

interface MockInterviewHistoryProps {
  limit?: number;
  showViewAll?: boolean;
}

const MockInterviewHistory = ({ limit = 5, showViewAll = true }: MockInterviewHistoryProps) => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  
  const [sessions, setSessions] = useState<MockInterviewSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const response = await axiosInstance.get(
          `${API_PATHS.MOCK_INTERVIEW.HISTORY}?limit=${limit}`
        );
        setSessions(response.data.sessions);
      } catch (err: any) {
        console.error("Failed to fetch mock interview history:", err);
        setError(err.response?.data?.message || "Failed to load history");
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [limit]);

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-500";
    if (score >= 60) return "text-yellow-500";
    return "text-red-500";
  };

  const getScoreBg = (score: number) => {
    if (score >= 80) return "bg-green-500/10";
    if (score >= 60) return "bg-yellow-500/10";
    return "bg-red-500/10";
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const handleViewReport = (sessionId: string) => {
    navigate(`/mock-interview/report/${sessionId}`);
  };

  const handleDelete = async (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    // Note: Backend doesn't have a delete endpoint for mock interviews yet
    // This is a placeholder for future implementation
    console.log("Delete session:", sessionId);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <SpinnerLoader size="medium" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-500 text-sm">{error}</p>
      </div>
    );
  }

  if (sessions.length === 0) {
    return (
      <div className="text-center py-8 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-dashed border-gray-300 dark:border-gray-700">
        <LuHistory className="w-12 h-12 text-gray-400 mx-auto mb-3" />
        <p className="text-gray-500 dark:text-gray-400 text-sm">
          {t("mockInterview.history.empty", "No mock interviews yet")}
        </p>
        <button
          onClick={() => navigate("/mock-interview/setup")}
          className="mt-3 text-blue-500 hover:text-blue-600 text-sm font-medium"
        >
          {t("mockInterview.history.startFirst", "Start your first interview")}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white flex items-center gap-2">
          <LuHistory className="w-5 h-5" />
          {t("mockInterview.history.title", "Mock Interview History")}
        </h3>
        {showViewAll && sessions.length >= limit && (
          <button
            onClick={() => navigate("/mock-interview/history")}
            className="text-sm text-blue-500 hover:text-blue-600 flex items-center gap-1"
          >
            {t("mockInterview.history.viewAll", "View All")}
            <LuArrowRight className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="space-y-3">
        {sessions.map((session, index) => (
          <motion.div
            key={session._id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            onClick={() => handleViewReport(session._id)}
            className="group bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700 cursor-pointer transition-all hover:shadow-md"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                {/* Icon */}
                <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <LuMic className="w-6 h-6 text-blue-500" />
                </div>

                {/* Info */}
                <div>
                  <h4 className="font-semibold text-gray-800 dark:text-white group-hover:text-blue-500 transition-colors">
                    {session.role}
                  </h4>
                  <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
                    <span className="flex items-center gap-1">
                      <LuCalendar className="w-3.5 h-3.5" />
                      {formatDate(session.completedAt || session.startedAt)}
                    </span>
                    <span>•</span>
                    <span>{session.experience} {t("common.years")}</span>
                  </div>
                </div>
              </div>

              {/* Score & Actions */}
              <div className="flex items-center gap-4">
                {session.overallScore !== undefined && (
                  <div className={`px-3 py-1.5 rounded-lg ${getScoreBg(session.overallScore)}`}>
                    <div className="flex items-center gap-1.5">
                      <LuTrendingUp className={`w-4 h-4 ${getScoreColor(session.overallScore)}`} />
                      <span className={`font-bold ${getScoreColor(session.overallScore)}`}>
                        {session.overallScore}
                      </span>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleViewReport(session._id);
                    }}
                    className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                    title={t("mockInterview.history.viewReport", "View Report")}
                  >
                    <LuEye className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Topics */}
            <div className="mt-3 flex flex-wrap gap-1.5">
              {session.topicsToFocus.slice(0, 3).map((topic, idx) => (
                <span
                  key={idx}
                  className="text-xs px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-full"
                >
                  {topic}
                </span>
              ))}
              {session.topicsToFocus.length > 3 && (
                <span className="text-xs px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-500 rounded-full">
                  +{session.topicsToFocus.length - 3}
                </span>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default MockInterviewHistory;

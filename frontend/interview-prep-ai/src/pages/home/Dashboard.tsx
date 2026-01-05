import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { LuPlus, LuSparkles } from "react-icons/lu";
import { toast } from "react-hot-toast";
import moment from "moment";
import DashboardLayout from "../../components/layouts/DashboardLayout";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../../utils/axiosInstance";
import { API_PATHS } from "../../utils/apiPaths";
import SummaryCard from "../../components/cards/SummaryCard";
import Modal from "../../components/Modal";
import CreateSessionForm from "./CreateSessionForm";
import DeleteAlertContent from "../../components/DeleteAlertContent";
import { Session } from "../../types";
import LanguageSwitcher from "../../components/LanguageSwitcher";

interface DeleteAlertState {
  open: boolean;
  data: Session | null;
}

const Dashboard = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [openCreateModal, setOpenCreateModal] = useState<boolean>(false);
  const [sessions, setSessions] = useState<Session[]>([]);

  const [openDeleteAlert, setOpenDeleteAlert] = useState<DeleteAlertState>({
    open: false,
    data: null,
  });

  const fetchAllSessions = async () => {
    try {
      const response = await axiosInstance.get<Session[]>(
        API_PATHS.SESSION.GET_ALL
      );
      setSessions(response.data);
    } catch (error) {
      toast.error(t("errors.fetchSessions"));
    }
  };

  const deleteSession = async (sessionData: Session | null) => {
    if (!sessionData) return;
    try {
      await axiosInstance.delete(API_PATHS.SESSION.DELETE(sessionData!._id));
      toast.success(t("dashboard.deleteSuccess"));
      setOpenDeleteAlert({ open: false, data: null });
      fetchAllSessions();
    } catch (error) {
      toast.error(t("errors.deleteSession"));
    }
  };

  useEffect(() => {
    fetchAllSessions();
  }, []);

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-bg-primary transition-colors duration-300">
        <div className="container mx-auto pt-8 pb-24 px-4">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-3">
              <h1 className="text-3xl font-bold text-text-primary">
                {t("dashboard.title")}{" "}
                <span className="gradient-text-purple">
                  {t("dashboard.sessions")}
                </span>
              </h1>
            </div>
            <p className="text-text-secondary ml-1">
              {sessions.length === 0
                ? t("dashboard.emptySubtitle")
                : t("dashboard.subtitle", { count: sessions.length })}
            </p>
          </div>

          {/* Sessions Grid */}
          {sessions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="w-20 h-20 bg-bg-tertiary rounded-2xl flex items-center justify-center mb-6 shadow-inner border border-border-primary">
                <LuSparkles className="text-4xl text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-text-primary mb-2">
                {t("dashboard.empty.title")}
              </h3>
              <p className="text-text-secondary text-center max-w-md mb-6">
                {t("dashboard.empty.description")}
              </p>
              <button
                className="btn-small"
                onClick={() => setOpenCreateModal(true)}
              >
                <LuPlus className="text-lg" />
                {t("dashboard.empty.cta")}
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sessions?.map((data) => (
                <SummaryCard
                  key={data?._id}
                  role={data.role}
                  topicsToFocus={data.topicsToFocus}
                  experience={data.experience}
                  questions={data.questions.length}
                  description={data.description}
                  language={data.language}
                  lastUpdated={data.updatedAt || null}
                  onSelect={() => navigate(`/interview-prep/${data._id}`)}
                  onDelete={() => setOpenDeleteAlert({ open: true, data })}
                />
              ))}
            </div>
          )}
        </div>

        {/* Floating Add Button */}
        {sessions.length > 0 && (
          <button
            className="flex items-center justify-center gap-2 bg-linear-to-r from-primary to-secondary text-sm font-semibold text-white px-6 py-3.5 rounded-full hover:shadow-2xl hover:shadow-primary/40 hover:scale-[1.05] transition-all duration-200 cursor-pointer fixed bottom-8 right-8 z-20"
            onClick={() => setOpenCreateModal(true)}
          >
            <LuPlus className="text-xl" />
            {t("dashboard.newSession")}
          </button>
        )}
      </div>

      <Modal
        isOpen={openCreateModal}
        onClose={() => {
          setOpenCreateModal(false);
        }}
        hideHeader
      >
        <div>
          <CreateSessionForm />
        </div>
      </Modal>

      <Modal
        isOpen={openDeleteAlert?.open}
        onClose={() => setOpenDeleteAlert({ open: false, data: null })}
        title={t("dashboard.deleteModal.title")}
      >
        <div className="">
          <DeleteAlertContent
            content={t("dashboard.deleteModal.content")}
            onDelete={() => deleteSession(openDeleteAlert.data)}
          />
        </div>
      </Modal>
    </DashboardLayout>
  );
};

export default Dashboard;

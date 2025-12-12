import { useEffect, useState } from "react";
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

interface DeleteAlertState {
  open: boolean;
  data: Session | null;
}

const Dashboard = () => {
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
      toast.error("Failed to fetch sessions. Please try again.");
    }
  };

  const deleteSession = async (sessionData: Session | null) => {
    if (!sessionData) return;
    try {
      await axiosInstance.delete(API_PATHS.SESSION.DELETE(sessionData!._id));
      toast.success("Session deleted successfully!");
      setOpenDeleteAlert({ open: false, data: null });
      fetchAllSessions();
    } catch (error) {
      toast.error("Failed to delete session. Please try again.");
    }
  };

  useEffect(() => {
    fetchAllSessions();
  }, []);

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-linear-to-br from-slate-50 via-indigo-50/20 to-purple-50/20">
        <div className="container mx-auto pt-8 pb-24 px-4">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-3">
              <h1 className="text-3xl font-bold text-slate-900">
                Your Interview{" "}
                <span className="gradient-text-purple">Sessions</span>
              </h1>
            </div>
            <p className="text-slate-600 ml-1">
              {sessions.length === 0
                ? "Start by creating your first interview prep session"
                : `You have ${sessions.length} active ${
                    sessions.length === 1 ? "session" : "sessions"
                  }`}
            </p>
          </div>

          {/* Sessions Grid */}
          {sessions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="w-20 h-20 bg-linear-to-br from-indigo-100 to-purple-100 rounded-2xl flex items-center justify-center mb-6">
                <LuSparkles className="text-4xl text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-2">
                No sessions yet
              </h3>
              <p className="text-slate-600 text-center max-w-md mb-6">
                Create your first interview preparation session and start
                practicing with AI-generated questions
              </p>
              <button
                className="btn-small"
                onClick={() => setOpenCreateModal(true)}
              >
                <LuPlus className="text-lg" />
                Create Your First Session
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
                  lastUpdated={
                    data.updatedAt
                      ? moment(data.updatedAt).format("Do MMM YYYY")
                      : ""
                  }
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
            New Session
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
        title="Delete Session"
      >
        <div className="">
          <DeleteAlertContent
            content="Are you sure you want to delete this session? This action cannot be undone and all associated questions will be permanently removed."
            onDelete={() => deleteSession(openDeleteAlert.data)}
          />
        </div>
      </Modal>
    </DashboardLayout>
  );
};

export default Dashboard;

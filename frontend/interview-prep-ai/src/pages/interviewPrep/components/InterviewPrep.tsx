import { useParams } from "react-router-dom";
import moment from "moment";
import { AnimatePresence, motion } from "framer-motion";
import { LuCircleAlert, LuListCollapse } from "react-icons/lu";
import SpinnerLoader from "../../../components/loader/SpinnerLoader";
import { toast } from "react-hot-toast";
import { useEffect, useState } from "react";
import DashboardLayout from "../../../components/layouts/DashboardLayout";
import RoleInfoHeader from "./RoleInfoHeader";
import axiosInstance from "../../../utils/axiosInstance";
import { API_PATHS } from "../../../utils/apiPaths";
import QuestionCard from "../../../components/cards/QuestionCard";
import AIResponsePreview from "./AIResponsePreview";
import Drawer from "../../../components/Drawer";
import SkeletonLoader from "../../../components/loader/SkeletonLoader";
import {
  Session,
  Question,
  ExplanationResponse,
  SessionResponse,
} from "../../../types";
import { AxiosError } from "axios";

const InterviewPrep = () => {
  const { sessionId } = useParams<{ sessionId: string }>();

  const [sessionData, setSessionData] = useState<Session | null>(null);
  const [errorMsg, setErrorMsg] = useState<string>("");

  const [openLeanMoreDrawer, setOpenLeanMoreDrawer] = useState<boolean>(false);
  const [explanation, setExplanation] = useState<ExplanationResponse | null>(
    null
  );

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isUpdateLoader, setIsUpdateLoader] = useState<boolean>(false);

  // Fetch session data by session id
  const fetchSessionDetailsById = async () => {
    if (!sessionId) return;

    try {
      const response = await axiosInstance.get<SessionResponse>(
        API_PATHS.SESSION.GET_ONE(sessionId)
      );

      if (response.data?.session) {
        setSessionData(response.data.session);
      }
    } catch (error) {
      toast.error("Failed to load session");
    }
  };

  // Generate concept explanation
  const generateConceptExplanation = async (question: string) => {
    try {
      setErrorMsg("");
      setExplanation(null);
      setIsLoading(true);
      setOpenLeanMoreDrawer(true);

      const response = await axiosInstance.post<ExplanationResponse>(
        API_PATHS.AI.GENERATE_EXPLANATION,
        {
          question,
        }
      );

      if (response.data) {
        setExplanation(response.data);
      }
    } catch (error) {
      const axiosError = error as AxiosError<{ message: string }>;
      setExplanation(null);
      setErrorMsg(
        axiosError.response?.data?.message ||
          "Something went wrong while generating explanation."
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Pin question
  const toggleQuestionPinStatus = async (questionId: string) => {
    try {
      const response = await axiosInstance.post(
        API_PATHS.QUESTION.PIN(questionId)
      );

      if (response.data?.question) {
        toast.success("Question pin status updated");
        fetchSessionDetailsById();
      }
    } catch (error) {
      toast.error("Failed to update pin status");
    }
  };

  // Add more questions to a session
  const uploadMoreQuestions = async () => {
    if (!sessionData) return;

    try {
      setIsUpdateLoader(true);

      const aiResponse = await axiosInstance.post<Question[]>(
        API_PATHS.AI.GENERATE_QUESTIONS,
        {
          role: sessionData.role,
          experience: sessionData.experience,
          topicsToFocus: sessionData.topicsToFocus,
          numberOfQuestions: 10,
        }
      );

      const generatedQuestions = aiResponse.data;

      const response = await axiosInstance.post(
        API_PATHS.QUESTION.ADD_TO_SESSION,
        {
          sessionId,
          questions: generatedQuestions,
        }
      );

      if (response.data) {
        toast.success("Added more Q&A!");
        fetchSessionDetailsById();
      }
    } catch (error) {
      const axiosError = error as AxiosError<{ message: string }>;
      if (axiosError.response?.data?.message) {
        setErrorMsg(axiosError.response.data.message);
      } else {
        setErrorMsg("An error occurred while adding more questions.");
      }
    } finally {
      setIsUpdateLoader(false);
    }
  };

  useEffect(() => {
    fetchSessionDetailsById();
  }, [sessionId]);

  if (!sessionData) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-screen">
          <SpinnerLoader />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <RoleInfoHeader
        role={sessionData.role}
        topicsToFocus={sessionData.topicsToFocus}
        experience={sessionData.experience}
        questions={sessionData.questions.length}
        description={sessionData.description}
        lastUpdated={
          sessionData.updatedAt
            ? moment(sessionData.updatedAt).format("Do MMM YYYY")
            : ""
        }
      />

      <div className="container mx-auto pt-4 pb-4 px-4 md:px-0">
        <h2 className="text-lg font-semibold color-black">Interview Q & A</h2>
        <div className="grid grid-cols-12 gap-4 mt-5 mb-10">
          <div
            className={`col-span-12 ${
              openLeanMoreDrawer ? "md:col-span-7" : "md:col-span-8"
            }`}
          >
            <AnimatePresence>
              {sessionData.questions.map((data, index) => (
                <motion.div
                  key={data._id || index}
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{
                    duration: 0.4,
                    type: "spring",
                    stiffness: 100,
                    delay: index * 0.1,
                    damping: 15,
                  }}
                  layout
                  layoutId={`question-${data._id || index}`}
                >
                  <QuestionCard
                    question={data.question}
                    answer={data.answer}
                    onLearnMore={() =>
                      generateConceptExplanation(data.question)
                    }
                    isPinned={data.isPinned || false}
                    onTogglePin={() => toggleQuestionPinStatus(data._id!)}
                  />

                  {!isLoading && sessionData.questions.length === index + 1 && (
                    <div className="flex items-center justify-center mt-5">
                      <button
                        className="flex items-center gap-3 text-sm text-white font-medium bg-black px-5 py-2 mr-2 rounded text-nowrap cursor-pointer"
                        disabled={isLoading || isUpdateLoader}
                        onClick={uploadMoreQuestions}
                      >
                        {isUpdateLoader ? (
                          <SpinnerLoader />
                        ) : (
                          <LuListCollapse className="text-lg" />
                        )}
                        Load More
                      </button>
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>

        <Drawer
          isOpen={openLeanMoreDrawer}
          onClose={() => setOpenLeanMoreDrawer(false)}
          title={!isLoading && explanation ? explanation.title : ""}
        >
          {errorMsg && (
            <p className="flex gap-2 text-sm text-amber-600 font-medium">
              <LuCircleAlert className="mt-1" /> {errorMsg}
            </p>
          )}
          {isLoading && <SkeletonLoader />}
          {!isLoading && explanation && (
            <AIResponsePreview content={explanation.explanation} />
          )}
        </Drawer>
      </div>
    </DashboardLayout>
  );
};

export default InterviewPrep;

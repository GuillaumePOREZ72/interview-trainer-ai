import { useState, FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import { toast } from "react-hot-toast";
import {
  LuBriefcase,
  LuCalendar,
  LuTags,
  LuFileText,
  LuArrowRight,
} from "react-icons/lu";
import Input from "../../components/inputs/Input";
import SpinnerLoader from "../../components/loader/SpinnerLoader";
import axiosInstance from "../../utils/axiosInstance";
import { API_PATHS } from "../../utils/apiPaths";
import {
  CreateSessionFormData,
  Question,
  CreateSessionResponse,
} from "../../types";
import { LuX } from "react-icons/lu";

const createQASessionSchema = (t: Function) =>
  z.object({
    role: z
      .string()
      .min(1, t("validation.roleRequired"))
      .max(100, t("validation.roleTooLong")),
    experience: z
      .number()
      .min(0, t("validation.experienceMin"))
      .max(50, t("validation.experienceMax")),
    topicsToFocus: z
      .array(z.string().min(1))
      .min(1, t("validation.topicsRequired"))
      .max(10, t("validation.topicsMax")),
    description: z.string().optional(),
  });

const CreateSessionForm = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [formData, setFormData] = useState<
    Omit<CreateSessionFormData, "topicsToFocus"> & { topicsToFocus: string[] }
  >({
    role: "",
    experience: 3,
    topicsToFocus: [],
    description: "",
  });

  const [currentTopic, setCurrentTopic] = useState("");
  const [errors, setErrors] = useState<Partial<Record<string, string>>>({});
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const schema = createQASessionSchema(t);

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleAddTopic = () => {
    if (!currentTopic.trim()) return;
    if (formData.topicsToFocus.length >= 10) {
      toast.error(t("mockInterview.setup.topicsMaxReached"));
      return;
    }
    if (formData.topicsToFocus.includes(currentTopic.trim())) {
      toast.error(t("mockInterview.setup.topicAlreadyAdded"));
      return;
    }
    const newTopics = [...formData.topicsToFocus, currentTopic.trim()];
    handleInputChange("topicsToFocus", newTopics);
    setCurrentTopic("");
  };

  const handleRemoveTopic = (topic: string) => {
    const newTopics = formData.topicsToFocus.filter((t) => t !== topic);
    handleInputChange("topicsToFocus", newTopics);
  };

  const handleCreateSession = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const result = schema.safeParse(formData);

    if (!result.success) {
      const newErrors: Partial<Record<string, string>> = {};
      result.error.issues.forEach((error: any) => {
        const field = error.path[0] as string;
        newErrors[field] = error.message;
      });
      setErrors(newErrors);
      toast.error(t("mockInterview.setup.validationError"));
      return;
    }

    setErrors({});
    setIsLoading(true);

    try {
      const { role, experience, topicsToFocus, description } = result.data;

      const aiResponse = await axiosInstance.post<Question[]>(
        API_PATHS.AI.GENERATE_QUESTIONS,
        {
          role,
          experience,
          topicsToFocus: topicsToFocus.join(", "),
          numberOfQuestions: 10,
        },
      );

      const generatedQuestions = aiResponse.data;

      const response = await axiosInstance.post<CreateSessionResponse>(
        API_PATHS.SESSION.CREATE,
        {
          role,
          experience,
          topicsToFocus: topicsToFocus.join(", "),
          description,
          questions: generatedQuestions,
        },
      );

      if (response.data?.session?._id) {
        navigate(`/interview-prep/${response.data.session._id}`);
      }
    } catch (error: any) {
      const message = error.response?.data?.message || t("errors.generic");
      setErrors({ form: message });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-[90vw] md:w-[40vw] p-8 flex flex-col justify-center">
      <form onSubmit={handleCreateSession} className="space-y-6">
        {/* Role Input */}
        <div>
          <Input
            label={t("createSession.role.label")}
            placeholder={t("createSession.role.placeholder")}
            icon={LuBriefcase}
            value={formData.role}
            onChange={(e) => handleInputChange("role", e.target.value)}
            error={errors.role || ""}
          />
        </div>

        {/* Experience Slider */}
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-2">
            {t("createSession.experience.label")}
          </label>
          <div className="flex items-center gap-4">
            <input
              type="range"
              min="0"
              max="50"
              value={formData.experience}
              onChange={(e) =>
                handleInputChange("experience", parseInt(e.target.value))
              }
              className="flex-1 h-2 bg-slate-200 dark:bg-gray-600 rounded-lg appearance-none cursor-pointer accent-primary"
            />
            <div className="flex items-center gap-2 min-w-[80px] px-3 py-2 bg-white dark:bg-gray-700 rounded-lg border border-slate-200 dark:border-gray-600">
              <LuCalendar className="w-4 h-4 text-slate-500 dark:text-gray-400" />
              <span className="text-slate-700 dark:text-gray-300 font-medium">
                {formData.experience} {t("common.years")}
              </span>
            </div>
          </div>
          {errors.experience && (
            <p className="mt-1 text-sm text-red-500">{errors.experience}</p>
          )}
        </div>

        {/* Topics Input with Tags */}
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-2">
            {t("createSession.topics.label")}
          </label>
          <div className="flex gap-2 mb-3">
            <div className="flex-1 relative">
              <LuTags className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 dark:text-gray-400" />
              <input
                type="text"
                value={currentTopic}
                onChange={(e) => setCurrentTopic(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddTopic();
                  }
                }}
                placeholder={t("createSession.topics.placeholder")}
                className="w-full pl-10 pr-4 py-3 !bg-white dark:!bg-gray-700 border border-slate-200 dark:border-gray-600 rounded-lg text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-gray-500 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all hover:border-slate-300 dark:hover:border-gray-500"
              />
            </div>
            <button
              type="button"
              onClick={handleAddTopic}
              disabled={
                !currentTopic.trim() || formData.topicsToFocus.length >= 10
              }
              className="px-4 py-2 bg-slate-100 dark:bg-gray-600 text-slate-700 dark:text-gray-300 rounded-lg hover:bg-primary hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {t("common.add")}
            </button>
          </div>

          {/* Topics Tags */}
          {formData.topicsToFocus.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-2">
              {formData.topicsToFocus.map((topic) => (
                <span
                  key={topic}
                  className="inline-flex items-center gap-1 px-3 py-1.5 bg-primary/10 text-primary rounded-full text-sm"
                >
                  {topic}
                  <button
                    type="button"
                    onClick={() => handleRemoveTopic(topic)}
                    className="hover:text-red-500 transition-colors"
                  >
                    <LuX className="w-3.5 h-3.5" />
                  </button>
                </span>
              ))}
            </div>
          )}
          {errors.topicsToFocus && (
            <p className="mt-1 text-sm text-red-500">{errors.topicsToFocus}</p>
          )}
          <p className="mt-1 text-xs text-slate-500 dark:text-gray-400">
            {formData.topicsToFocus.length}/10{" "}
            {t("createSession.topics.label").toLowerCase()}
          </p>
        </div>

        {/* Description Input */}
        <div>
          <Input
            label={t("createSession.description.label")}
            placeholder={t("createSession.description.placeholder")}
            icon={LuFileText}
            value={formData.description}
            onChange={(e) => handleInputChange("description", e.target.value)}
          />
          <p className="mt-1 text-xs text-slate-500 dark:text-gray-400">
            ({t("createSession.description.optional")})
          </p>
        </div>

        {errors.form && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg text-sm">
            {errors.form}
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          className="btn-primary w-full"
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <SpinnerLoader /> {t("createSession.generating")}
            </>
          ) : (
            <>
              {t("createSession.submit")}
              <LuArrowRight className="text-lg" />
            </>
          )}
        </button>
      </form>
    </div>
  );
};

export default CreateSessionForm;

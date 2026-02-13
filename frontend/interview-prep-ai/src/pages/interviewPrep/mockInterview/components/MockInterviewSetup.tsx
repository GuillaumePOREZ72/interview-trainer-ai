import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { toast } from "react-hot-toast";
import { LuBriefcase, LuCalendar, LuTags, LuLanguages, LuMic, LuArrowRight } from "react-icons/lu";
import DashboardLayout from "../../../../components/layouts/DashboardLayout";
import Input from "../../../../components/inputs/Input";
import SpinnerLoader from "../../../../components/loader/SpinnerLoader";
import axiosInstance from "../../../../utils/axiosInstance";
import { API_PATHS } from "../../../../utils/apiPaths";
import { StartInterviewRequest } from "../../../../types";

const mockInterviewSchema = z.object({
  role: z.string().min(1, "roleRequired").max(100, "roleTooLong"),
  experience: z.number().min(0, "experienceMin").max(50, "experienceMax"),
  topicsToFocus: z.array(z.string().min(1)).min(1, "topicsRequired").max(10, "topicsMax"),
  language: z.enum(["fr", "en"]),
});

type FormData = z.infer<typeof mockInterviewSchema>;

const MockInterviewSetup = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { startInterview, state } = useMockInterview(t, i18n.language as "fr" | "en");

  const [formData, setFormData] = useState<FormData>({
    role: "",
    experience: 3,
    topicsToFocus: [],
    language: (i18n.language as "fr" | "en") || "en",
  });

  const [currentTopic, setCurrentTopic] = useState("");
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);

  const validateField = (field: keyof FormData, value: any) => {
    const result = mockInterviewSchema.safeParse({ ...formData, [field]: value });
    if (!result.success) {
      const fieldError = result.error.errors.find((e) => e.path[0] === field);
      setErrors((prev) => ({ ...prev, [field]: fieldError?.message || "" }));
      return false;
    } else {
      setErrors((prev) => ({ ...prev, [field]: "" }));
      return true;
    }
  };

  const handleInputChange = (field: keyof FormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    validateField(field, value);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const result = mockInterviewSchema.safeParse(formData);
    if (!result.success) {
      const newErrors: Partial<Record<keyof FormData, string>> = {};
      result.error.errors.forEach((error) => {
        const field = error.path[0] as keyof FormData;
        newErrors[field] = error.message;
      });
      setErrors(newErrors);
      toast.error(t("mockInterview.setup.validationError"));
      return;
    }

    setIsConnecting(true);
    try {
      const response = await axiosInstance.post(
        API_PATHS.MOCK_INTERVIEW.START,
        formData
      );
      const { sessionId } = response.data;
      navigate(`/mock-interview/session/${sessionId}`);
    } catch (error) {
      console.error("Failed to start interview:", error);
      toast.error(t("mockInterview.errors.startFailed"));
      setIsConnecting(false);
    }
  };

  if (isConnecting) {
    return (
      <DashboardLayout>
        <div className="min-h-screen bg-bg-primary flex items-center justify-center">
          <div className="text-center">
            <SpinnerLoader size="large" />
            <p className="mt-4 text-text-secondary">
              {t("mockInterview.setup.connecting")}
            </p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-bg-primary transition-colors duration-300">
        <div className="container mx-auto pt-8 pb-24 px-4 md:px-8 max-w-2xl">
          {/* Header */}
          <div className="mb-8 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r from-primary to-secondary mb-4">
              <LuMic className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-text-primary mb-2">
              {t("mockInterview.setup.title")}
            </h1>
            <p className="text-text-secondary">
              {t("mockInterview.setup.subtitle")}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Role Input */}
            <div>
              <Input
                label={t("mockInterview.setup.role.label")}
                placeholder={t("mockInterview.setup.role.placeholder")}
                icon={LuBriefcase}
                value={formData.role}
                onChange={(e) => handleInputChange("role", e.target.value)}
                error={errors.role ? t(`validation.${errors.role}`) : ""}
              />
            </div>

            {/* Experience Input */}
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                {t("mockInterview.setup.experience.label")}
              </label>
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min="0"
                  max="50"
                  value={formData.experience}
                  onChange={(e) => handleInputChange("experience", parseInt(e.target.value))}
                  className="flex-1 h-2 bg-bg-tertiary rounded-lg appearance-none cursor-pointer accent-primary"
                />
                <div className="flex items-center gap-2 min-w-[80px] px-3 py-2 bg-bg-secondary rounded-lg border border-border-primary">
                  <LuCalendar className="w-4 h-4 text-text-tertiary" />
                  <span className="text-text-primary font-medium">
                    {formData.experience} {t("common.years")}
                  </span>
                </div>
              </div>
              {errors.experience && (
                <p className="mt-1 text-sm text-danger">
                  {t(`validation.${errors.experience}`)}
                </p>
              )}
            </div>

            {/* Topics Input */}
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                {t("mockInterview.setup.topics.label")}
              </label>
              <div className="flex gap-2 mb-3">
                <div className="flex-1 relative">
                  <LuTags className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-tertiary" />
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
                    placeholder={t("mockInterview.setup.topics.placeholder")}
                    className="w-full pl-10 pr-4 py-3 bg-bg-secondary border border-border-primary rounded-lg text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleAddTopic}
                  disabled={!currentTopic.trim() || formData.topicsToFocus.length >= 10}
                  className="px-4 py-2 bg-bg-tertiary text-text-primary rounded-lg hover:bg-primary hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {t("common.add")}
                </button>
              </div>

              {/* Topics Tags */}
              {formData.topicsToFocus.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.topicsToFocus.map((topic) => (
                    <span
                      key={topic}
                      className="inline-flex items-center gap-1 px-3 py-1.5 bg-primary/10 text-primary rounded-full text-sm"
                    >
                      {topic}
                      <button
                        type="button"
                        onClick={() => handleRemoveTopic(topic)}
                        className="hover:text-danger transition-colors"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
              {errors.topicsToFocus && (
                <p className="mt-1 text-sm text-danger">
                  {t(`validation.${errors.topicsToFocus}`)}
                </p>
              )}
              <p className="mt-1 text-xs text-text-tertiary">
                {t("mockInterview.setup.topics.help", {
                  count: formData.topicsToFocus.length,
                  max: 10,
                })}
              </p>
            </div>

            {/* Language Selection */}
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                {t("mockInterview.setup.language.label")}
              </label>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => handleInputChange("language", "fr")}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg border-2 transition-all ${
                    formData.language === "fr"
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border-primary bg-bg-secondary text-text-secondary hover:border-primary/50"
                  }`}
                >
                  <span className="text-lg">🇫🇷</span>
                  <span className="font-medium">{t("common.french")}</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleInputChange("language", "en")}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg border-2 transition-all ${
                    formData.language === "en"
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border-primary bg-bg-secondary text-text-secondary hover:border-primary/50"
                  }`}
                >
                  <span className="text-lg">🇬🇧</span>
                  <span className="font-medium">{t("common.english")}</span>
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-4">
              <button
                type="submit"
                disabled={isSubmitting}
                className="btn-primary"
              >
                {isSubmitting ? (
                  <>
                    <SpinnerLoader size="small" />
                    {t("mockInterview.setup.starting")}
                  </>
                ) : (
                  <>
                    {t("mockInterview.setup.startButton")}
                    <LuArrowRight className="text-lg" />
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default MockInterviewSetup;

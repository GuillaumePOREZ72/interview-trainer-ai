import { useState, FormEvent } from "react";
import { useTranslation } from "react-i18next";
import Input from "../../components/inputs/Input";
import { validateEmail } from "../../utils/helper";
import axiosInstance from "../../utils/axiosInstance";
import { API_PATHS } from "../../utils/apiPaths";
import { AxiosError } from "axios";
import { LuKeyRound } from "react-icons/lu";

interface ForgotPasswordProps {
  setCurrentPage: (page: any) => void;
}

const ForgotPassword = ({ setCurrentPage }: ForgotPasswordProps) => {
  const { t } = useTranslation();
  const [email, setEmail] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [message, setMessage] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  const handleForgotPassword = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const trimmedEmail = email.trim();

    if (!validateEmail(trimmedEmail)) {
      setError(t("validation.invalidEmail"));
      return;
    }

    setError("");
    setMessage("");
    setLoading(true);

    try {
      await axiosInstance.post(API_PATHS.AUTH.FORGOT_PASSWORD, {
        email: trimmedEmail,
      });

      setMessage(t("auth.forgotPassword.successMessage"));
    } catch (error) {
      const axiosError = error as AxiosError<{ message: string }>;
      if (axiosError.response?.data?.message) {
        setError(axiosError.response.data.message);
      } else {
        setError(t("errors.generic"));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-[90vw] md:w-[60vw] lg:w-[33vw] p-8 flex flex-col justify-center">
      <div className="flex items-center gap-2 mb-2">
        <div className="w-10 h-10 bg-linear-to-br from-primary to-secondary rounded-lg flex items-center justify-center">
          <LuKeyRound className="text-white text-xl" />
        </div>
        <h3 className="text-2xl font-bold text-slate-900">
          {t("auth.forgotPassword.title")}
        </h3>
      </div>
      <p className="text-sm text-slate-600 mt-2 mb-8">
        {t("auth.forgotPassword.subtitle")}
      </p>

      {message ? (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm mb-6">
          {message}
        </div>
      ) : (
        <form onSubmit={handleForgotPassword} className="space-y-1">
          <Input
            value={email}
            onChange={({ target }) => setEmail(target.value)}
            label={t("auth.forgotPassword.email")}
            placeholder={t("auth.forgotPassword.emailPlaceholder")}
            type="email"
          />

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="btn-primary mt-6 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={loading}
          >
            {loading ? t("common.loading") : t("auth.forgotPassword.submit")}
          </button>
        </form>
      )}

      <p className="text-sm text-slate-600 mt-6 text-center">
        <button
          type="button"
          className="font-semibold text-slate-900 hover:underline cursor-pointer"
          onClick={() => setCurrentPage("login")}
        >
          {t("auth.forgotPassword.backToLogin")}
        </button>
      </p>
    </div>
  );
};

export default ForgotPassword;

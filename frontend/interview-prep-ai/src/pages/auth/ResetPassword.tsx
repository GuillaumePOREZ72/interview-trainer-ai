import { useState, FormEvent, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Input from "../../components/inputs/Input";
import axiosInstance from "../../utils/axiosInstance";
import { API_PATHS } from "../../utils/apiPaths";
import { AxiosError } from "axios";
import { LuLock } from "react-icons/lu";
import { toast } from "react-hot-toast";

const ResetPassword = () => {
  const { t } = useTranslation();
  const { resetToken } = useParams();
  const navigate = useNavigate();

  const [password, setPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    if (!resetToken) {
      setError(t("auth.resetPassword.invalidToken"));
    }
  }, [resetToken, t]);

  const handleResetPassword = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      setError(t("validation.passwordMismatch"));
      return;
    }

    if (password.length < 6) {
      setError(t("validation.passwordTooShort"));
      return;
    }

    setError("");
    setLoading(true);

    try {
      await axiosInstance.put(
        `${API_PATHS.AUTH.RESET_PASSWORD}/${resetToken}`,
        {
          password,
        },
      );

      toast.success(t("auth.resetPassword.successMessage"));

      // Redirect to home (Login modal handling could be improved later)
      setTimeout(() => {
        navigate("/");
      }, 2000);
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
    <div className="w-full min-h-screen bg-bg-primary flex items-center justify-center p-4">
      <div className="bg-white dark:bg-bg-secondary w-full max-w-md p-8 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800">
        <div className="flex flex-col items-center mb-6">
          <div className="w-12 h-12 bg-linear-to-br from-primary to-secondary rounded-xl flex items-center justify-center mb-4 shadow-lg shadow-violet-500/20">
            <LuLock className="text-white text-2xl" />
          </div>
          <h2 className="text-2xl font-bold text-text-primary text-center">
            {t("auth.resetPassword.title")}
          </h2>
          <p className="text-text-secondary text-center mt-2">
            {t("auth.resetPassword.subtitle")}
          </p>
        </div>

        <form onSubmit={handleResetPassword} className="space-y-4">
          <Input
            value={password}
            onChange={({ target }) => setPassword(target.value)}
            label={t("auth.resetPassword.newPassword")}
            placeholder={t("auth.resetPassword.newPasswordPlaceholder")}
            type="password"
          />

          <Input
            value={confirmPassword}
            onChange={({ target }) => setConfirmPassword(target.value)}
            label={t("auth.resetPassword.confirmPassword")}
            placeholder={t("auth.resetPassword.confirmPasswordPlaceholder")}
            type="password"
          />

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="w-full btn-primary mt-4 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={loading || !resetToken}
          >
            {loading ? t("common.loading") : t("auth.resetPassword.submit")}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;

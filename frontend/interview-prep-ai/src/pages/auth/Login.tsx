import { useState, FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Input from "../../components/inputs/Input";
import axiosInstance from "../../utils/axiosInstance";
import { API_PATHS } from "../../utils/apiPaths";
import { useUser } from "../../hooks/useUser";
import { AxiosError } from "axios";
import { AuthResponse, User } from "../../types";
import { LuSparkles } from "react-icons/lu";
import { loginSchema } from "../../utils/validationSchemas";

interface LoginProps {
  setCurrentPage: (page: "login" | "signup" | "forgotPassword") => void;
}

const Login = ({ setCurrentPage }: LoginProps) => {
  const { t } = useTranslation();
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [error, setError] = useState<string>("");

  const { updateUser } = useUser();
  const navigate = useNavigate();

  const handleLogin = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const result = loginSchema.safeParse({
      email: email,
      password: password,
    });

    if (!result.success) {
      const firstError = result.error.issues[0];
      const message = firstError.message.includes(".")
        ? t(firstError.message as string)
        : firstError.message;
      setError(message);
      return;
    }

    const { email: trimmedEmail, password: trimmedPassword } = result.data;

    setError("");

    // Login API call
    try {
      const response = await axiosInstance.post<{ user: User }>(
        API_PATHS.AUTH.LOGIN,
        {
          email: trimmedEmail,
          password: trimmedPassword,
        },
      );

      updateUser(response.data.user);
      navigate("/dashboard");
    } catch (error) {
      const axiosError = error as AxiosError<{ message: string }>;
      if (axiosError.response?.data?.message) {
        setError(axiosError.response.data.message);
      } else {
        setError(t("errors.generic"));
      }
    }
  };

  return (
    <div className="w-[90vw] md:w-[60vw] lg:w-[33vw] p-8 flex flex-col justify-center">
      {/* Header with icon */}
      <div className="flex items-center gap-2 mb-2">
        <div className="w-10 h-10 bg-linear-to-br from-primary to-secondary rounded-lg flex items-center justify-center">
          <LuSparkles className="text-white text-xl" />
        </div>
        <h3 className="text-2xl font-bold text-slate-900">
          {t("auth.login.title")}
        </h3>
      </div>
      <p className="text-sm text-slate-600 mt-2 mb-8">
        {t("auth.login.subtitle")}
      </p>

      <form onSubmit={handleLogin} className="space-y-1">
        <Input
          id="email"
          value={email}
          onChange={({ target }) => setEmail(target.value)}
          label={t("auth.login.email")}
          placeholder={t("auth.login.emailPlaceholder")}
          type="email"
        />

        <Input
          id="password"
          value={password}
          onChange={({ target }) => setPassword(target.value)}
          label={t("auth.login.password")}
          placeholder={t("auth.login.passwordPlaceholder")}
          type="password"
        />

        <div className="flex justify-end mt-1">
          <button
            type="button"
            className="text-xs text-slate-500 hover:text-primary transition-colors cursor-pointer"
            onClick={() => setCurrentPage("forgotPassword")}
          >
            {t("auth.login.forgotPassword")}
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        <button type="submit" className="btn-primary mt-6">
          {t("auth.login.submit")}
        </button>
        <p className="text-sm text-slate-600 mt-6">
          {t("auth.login.noAccount")}{" "}
          <button
            type="button"
            className="font-semibold gradient-text-purple hover:underline cursor-pointer"
            onClick={() => setCurrentPage("signup")}
          >
            {t("auth.login.signupLink")}
          </button>
        </p>
      </form>
    </div>
  );
};

export default Login;

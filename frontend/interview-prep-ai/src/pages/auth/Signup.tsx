import { useState, FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Input from "../../components/inputs/Input";
import { useUser } from "../../hooks/useUser";
import axiosInstance from "../../utils/axiosInstance";
import { API_PATHS } from "../../utils/apiPaths";
import { AuthResponse, User } from "../../types";
import { AxiosError } from "axios";
import { LuSparkles } from "react-icons/lu";
import { signupSchema } from "../../utils/validationSchemas";

interface SignupProps {
  setCurrentPage: (page: "login" | "signup") => void;
}

const Signup = ({ setCurrentPage }: SignupProps) => {
  const { t } = useTranslation();
  const [fullName, setFullName] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");

  const [error, setError] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const { updateUser } = useUser();
  const navigate = useNavigate();

  const handleSignup = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const result = signupSchema.safeParse({
      name: fullName,
      email: email,
      password: password,
    });

    if (!result.success) {
      const firstError = result.error.issues[0];
      // If the error message is a translation key (e.g. validation.invalidEmail), use t()
      // otherwise use the message directly (e.g. "Password must be...")
      const message = firstError.message.includes(".")
        ? t(firstError.message as string)
        : firstError.message;
      setError(message);
      return;
    }

    const {
      name: trimmedFullName,
      email: trimmedEmail,
      password: trimmedPassword,
    } = result.data;

    setError("");

    // Signup API Call
    try {
      setIsLoading(true);

      const response = await axiosInstance.post<{ user: User }>(
        API_PATHS.AUTH.REGISTER,
        {
          name: trimmedFullName,
          email: trimmedEmail,
          password: trimmedPassword,
        },
      );

      updateUser(response.data.user);
      navigate("/dashboard");
    } catch (error) {
      const axiosError = error as AxiosError<{ message: string }>;
      if (axiosError.response?.data.message) {
        setError(axiosError.response.data.message);
      } else {
        setError(t("errors.generic"));
      }
    } finally {
      setIsLoading(false);
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
          {t("auth.signup.title")}
        </h3>
      </div>
      <p className="text-sm text-slate-600 mb-8">{t("auth.signup.subtitle")}</p>

      <form onSubmit={handleSignup} className="space-y-1">
        <div className="grid grid-cols-1 md:grid-cols-1 gap-2">
          <Input
            id="fullName"
            value={fullName}
            onChange={({ target }) => setFullName(target.value)}
            label={t("auth.signup.fullName")}
            placeholder={t("auth.signup.fullNamePlaceholder")}
            type="text"
          />

          <Input
            id="email"
            value={email}
            onChange={({ target }) => setEmail(target.value)}
            label={t("auth.signup.email")}
            placeholder={t("auth.signup.emailPlaceholder")}
            type="text"
          />

          <Input
            id="password"
            value={password}
            onChange={({ target }) => setPassword(target.value)}
            label={t("auth.signup.password")}
            placeholder={t("auth.signup.passwordPlaceholder")}
            type="password"
          />
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        <button type="submit" className="btn-primary mt-6" disabled={isLoading}>
          {isLoading ? t("auth.signup.creating") : t("auth.signup.submit")}
        </button>

        <p className="text-sm text-slate-600 text-center mt-6">
          {t("auth.signup.hasAccount")}{" "}
          <button
            type="button"
            className="font-semibold gradient-text-purple hover:underline cursor-pointer"
            onClick={() => setCurrentPage("login")}
          >
            {t("auth.signup.loginLink")}
          </button>
        </p>
      </form>
    </div>
  );
};

export default Signup;

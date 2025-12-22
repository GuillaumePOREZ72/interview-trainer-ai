import { useState, FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import Input from "../../components/inputs/Input";
import { validateEmail } from "../../utils/helper";
import axiosInstance from "../../utils/axiosInstance";
import { API_PATHS } from "../../utils/apiPaths";
import { useUser } from "../../hooks/useUser";
import { AxiosError } from "axios";
import { AuthResponse } from "../../types";
import { LuSparkles } from "react-icons/lu";

interface LoginProps {
  setCurrentPage: (page: "login" | "signup") => void;
}

const Login = ({ setCurrentPage }: LoginProps) => {
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [error, setError] = useState<string>("");

  const { updateUser } = useUser();
  const navigate = useNavigate();

  const handleLogin = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!validateEmail(email)) {
      setError("Please enter a valid email address.");
      return;
    }

    if (!password) {
      setError("Please enter the password");
      return;
    }

    setError("");

    // Login API call
    try {
      const response = await axiosInstance.post<AuthResponse>(
        API_PATHS.AUTH.LOGIN,
        {
          email,
          password,
        }
      );

      const { token } = response.data;

      if (token) {
        localStorage.setItem("token", token);
        updateUser(response.data);
        navigate("/dashboard");
      }
    } catch (error) {
      const axiosError = error as AxiosError<{ message: string }>;
      if (axiosError.response?.data?.message) {
        setError(axiosError.response.data.message);
      } else {
        setError("Something went wrong. Please try again.");
      }
    }
  };

  return (
    <div className="w-[90vw] md:w-[33vw] p-8 flex flex-col justify-center">
      {/* Header with icon */}
      <div className="flex items-center gap-2 mb-2">
        <div className="w-10 h-10 bg-linear-to-br from-primary to-secondary rounded-lg flex items-center justify-center">
          <LuSparkles className="text-white text-xl" />
        </div>
        <h3 className="text-2xl font-bold text-slate-900">Welcome Back</h3>
      </div>
      <p className="text-sm text-slate-600 mt-2 mb-8">
        Please enter your credentials to continue
      </p>

      <form onSubmit={handleLogin} className="space-y-1">
        <Input
          value={email}
          onChange={({ target }) => setEmail(target.value)}
          label="Email Address"
          placeholder="johndoe@example.com"
          type="email"
        />

        <Input
          value={password}
          onChange={({ target }) => setPassword(target.value)}
          label="Password"
          placeholder="Enter your password (min 8 characters)"
          type="password"
        />

        {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>}

        <button type="submit" className="btn-primary mt-6">
          Sign In
        </button>
        <p className="text-sm text-slate-600 mt-6">
          Don't have an account?{" "}
          <button
            type="button"
            className="font-semibold gradient-text-purple hover:underline cursor-pointer"
            onClick={() => setCurrentPage("signup")}
          >
            Signup for free
          </button>
        </p>
      </form>
    </div>
  );
};

export default Login;

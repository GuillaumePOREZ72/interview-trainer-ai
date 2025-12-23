import { useState, FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import Input from "../../components/inputs/Input";
import ProfilePhotoSelector from "../../components/inputs/ProfilePhotoSelector";
import { validateEmail } from "../../utils/helper";
import { useUser } from "../../hooks/useUser";
import axiosInstance from "../../utils/axiosInstance";
import { API_PATHS } from "../../utils/apiPaths";
import uploadImage from "../../utils/uploadImage";
import { AuthResponse } from "../../types";
import { AxiosError } from "axios";
import { LuSparkles } from "react-icons/lu";

interface SignupProps {
  setCurrentPage: (page: "login" | "signup") => void;
}

const Signup = ({ setCurrentPage }: SignupProps) => {
  const [profilePic, setProfilePic] = useState<File | null>(null);
  const [fullName, setFullName] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");

  const [error, setError] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const { updateUser } = useUser();
  const navigate = useNavigate();

  const handleSignup = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    let profileImageUrl = "";

    if (!fullName) {
      setError("Please enter full name");
      return;
    }

    if (!validateEmail(email)) {
      setError("Please enter a valid email address.");
      return;
    }

    if (!password) {
      setError("Please enter the password");
      return;
    }

    setError("");

    // Signup API Call
    try {
      setIsLoading(true);

      if (profilePic) {
        const imgUploadRes = await uploadImage(profilePic);
        profileImageUrl = imgUploadRes.imageUrl || "";
      }

      const response = await axiosInstance.post<AuthResponse>(
        API_PATHS.AUTH.REGISTER,
        {
          name: fullName,
          email,
          password,
          profileImageUrl,
        }
      );

      const { token } = response.data;

      if (token) {
        updateUser(response.data);
        navigate("/dashboard");
      }
    } catch (error) {
      const axiosError = error as AxiosError<{ message: string }>;
      if (axiosError.response?.data.message) {
        setError(axiosError.response.data.message);
      } else {
        setError("Something went wrong. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-[90vw] md:w-[33vw] p-8 flex flex-col justify-center">
      {/* Header with icon */}
      <div className="flex items-center gap-2 mb-2">
        <div className="w-10 h-10 bg-linear-to-br from-primary to-secondary rounded-lg flex items-center justify-center">
          <LuSparkles className="text-white text-xl" />
        </div>
        <h3 className="text-2xl font-bold text-slate-900">Create Account</h3>
      </div>
      <p className="text-sm text-slate-600 mb-8">
        Start your interview preparation journey today
      </p>

      <form onSubmit={handleSignup} className="space-y-1">
        <ProfilePhotoSelector image={profilePic} setImage={setProfilePic} />

        <div className="grid grid-cols-1 md:grid-cols-1 gap-2">
          <Input
            value={fullName}
            onChange={({ target }) => setFullName(target.value)}
            label="Full Name"
            placeholder="John Doe"
            type="text"
          />

          <Input
            value={email}
            onChange={({ target }) => setEmail(target.value)}
            label="Email Address"
            placeholder="johndoe@example.com"
            type="text"
          />

          <Input
            value={password}
            onChange={({ target }) => setPassword(target.value)}
            label="Password"
            placeholder="Minimum 8 characters"
            type="password"
          />
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        <button type="submit" className="btn-primary mt-6" disabled={isLoading}>
          {" "}
          {isLoading ? "Creating Account..." : "Create Account"}
        </button>

        <p className="text-sm text-slate-600 text-center mt-6">
          Already have an account?{" "}
          <button
            type="button"
            className="font-semibold gradient-text-purple hover:underline cursor-pointer"
            onClick={() => setCurrentPage("login")}
          >
            Sign In
          </button>
        </p>
      </form>
    </div>
  );
};

export default Signup;

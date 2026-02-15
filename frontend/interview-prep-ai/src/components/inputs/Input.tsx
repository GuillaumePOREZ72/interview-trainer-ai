import { useState, ChangeEvent } from "react";
import { FaRegEye, FaRegEyeSlash } from "react-icons/fa6";
import { IconType } from "react-icons";

type InputType = "text" | "password" | "email" | "number" | "tel" | "url";

interface InputProps {
  value: string | number;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  onBlur?: () => void;
  placeholder?: string;
  type?: InputType;
  label?: string;
  id?: string;
  icon?: IconType;
  error?: string;
}

const Input = ({
  value,
  onChange,
  onBlur,
  placeholder = "",
  type = "text",
  label,
  id,
  icon: Icon,
  error,
}: InputProps) => {
  const [showPassword, setShowPassword] = useState<boolean>(false);

  const togglePassword = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={id}
          className="block text-sm font-medium mb-2 text-slate-700 dark:text-gray-300"
        >
          {label}
        </label>
      )}
      <div
        className={`relative flex items-center w-full border rounded-lg px-4 py-3 transition-all duration-200 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 
        !bg-white dark:!bg-gray-700 
        border-slate-200 dark:border-gray-600 
        hover:border-slate-300 dark:hover:border-gray-500
        ${error ? "!border-red-500" : ""}`}
      >
        {Icon && (
          <Icon className="w-5 h-5 mr-3 flex-shrink-0 text-slate-400 dark:text-gray-400" />
        )}
        <input
          id={id}
          name={id}
          type={
            type === "password" ? (showPassword ? "text" : "password") : type
          }
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          className="w-full bg-transparent outline-none text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-gray-500"
        />
        {type === "password" && (
          <button
            type="button"
            onClick={togglePassword}
            aria-label={showPassword ? "Hide password" : "Show password"}
            aria-pressed={showPassword}
            className="ml-2 hover:text-primary transition-colors cursor-pointer text-slate-400 dark:text-gray-400"
          >
            {showPassword ? (
              <FaRegEye size={20} />
            ) : (
              <FaRegEyeSlash size={20} />
            )}
          </button>
        )}
      </div>
      {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
    </div>
  );
};

export default Input;

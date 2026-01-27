import { useState, ChangeEvent } from "react";
import { FaRegEye, FaRegEyeSlash } from "react-icons/fa6";

type InputType = "text" | "password" | "email" | "number" | "tel" | "url";

interface InputProps {
  value: string | number;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  type?: InputType;
  label?: string;
  id?: string;
}

const Input = ({
  value,
  onChange,
  placeholder = "",
  type = "text",
  label,
  id,
}: InputProps) => {
  const [showPassword, setShowPassword] = useState<boolean>(false);

  const togglePassword = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-slate-700 mb-2">
          {label}
        </label>
      )}
      <div className="relative flex items-center w-full bg-white border border-slate-200 rounded-lg px-4 py-3 transition-all duration-200 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 hover:border-slate-300">
        <input
          id={id}
          name={id}
          type={
            type === "password" ? (showPassword ? "text" : "password") : type
          }
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          className="w-full bg-transparent outline-none text-sm text-slate-900 placeholder:text-slate-400"
        />
        {type === "password" && (
          <button
            type="button"
            onClick={togglePassword}
            className="ml-2 text-slate-400 hover:text-primary transition-colors cursor-pointer"
          >
            {showPassword ? (
              <FaRegEye size={20} />
            ) : (
              <FaRegEyeSlash size={20} />
            )}
          </button>
        )}
      </div>
    </div>
  );
};

export default Input;

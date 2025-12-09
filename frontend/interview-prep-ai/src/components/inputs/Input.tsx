import { useState, ChangeEvent } from "react";
import { FaRegEye, FaRegEyeSlash } from "react-icons/fa6";

type InputType = "text" | "password" | "email" | "number" | "tel" | "url";

interface InputProps {
  value: string | number;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  label: string;
  placeholder?: string;
  type?: InputType;
}

const Input = ({
  value,
  onChange,
  label,
  placeholder = "",
  type = "text",
}: InputProps) => {
  const [showPassword, setShowPassword] = useState<boolean>(false);

  const togglePassword = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div>
      <label className="text-[13px] text-slate-800">{label}</label>
      <div className="input-box">
        <input
          type={
            type === "password" ? (showPassword ? "text" : "password") : type
          }
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          className="w-full bg-transparent outline-none"
        />
        {type === "password" && (
          <>
            {showPassword ? (
              <FaRegEye
                size={22}
                className="text-primary cursor-pointer"
                onClick={togglePassword}
              />
            ) : (
              <FaRegEyeSlash
                size={22}
                className="text-slate-400 cursor-pointer"
                onClick={togglePassword}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Input;

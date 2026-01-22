import ProfileInfoCard from "../cards/ProfileInfoCard";
import LOGO from "../../assets/logo.png";
import { Link } from "react-router-dom";
import { LuSun, LuMoon } from "react-icons/lu";
import { useTheme } from "../../hooks/useTheme";
import LanguageSwitcher from "../LanguageSwitcher";

const Navbar = () => {
  const { theme, setTheme } = useTheme();

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  return (
    <div className="h-16 bg-white/80 backdrop-blur-md border-b border-slate-200/50 py-2.5 px-4 md:px-8 sticky top-0 z-50 shadow-sm transition-colors duration-300">
      <div className="container mx-auto flex items-center justify-between gap-5">
        <Link to="/dashboard" className="flex items-center gap-3 group">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center shadow-lg shadow-violet-500/20 transition-transform group-hover:scale-105 overflow-hidden">
            <img
              src={LOGO}
              alt="Interview Trainer AI Logo"
              className="w-full h-full object-cover"
            />
          </div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            Interview Trainer <span className="text-secondary">AI</span>
          </h2>
        </Link>

        <div className="flex items-center gap-4">
          <LanguageSwitcher className="text-slate-900 transition-colors duration-300" />
          <button
            onClick={toggleTheme}
            className="p-2 rounded-full hover:bg-bg-secondary text-slate-900 hover:text-primary transition-all cursor-pointer"
            aria-label="Toggle theme"
          >
            {theme === "dark" ? (
              <LuSun className="text-xl" />
            ) : (
              <LuMoon className="text-xl" />
            )}
          </button>
          <ProfileInfoCard className="!text-slate-900" />
        </div>
      </div>
    </div>
  );
};

export default Navbar;

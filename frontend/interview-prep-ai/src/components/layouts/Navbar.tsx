import ProfileInfoCard from "../cards/ProfileInfoCard";
import { Link } from "react-router-dom";
import { LuSparkles, LuSun, LuMoon } from "react-icons/lu";
import { useTheme } from "../../hooks/useTheme";
import LanguageSwitcher from "../LanguageSwitcher";

const Navbar = () => {
  const { theme, setTheme } = useTheme();

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  return (
    <div className="h-16 bg-white/80 backdrop-blur-md border-b border-slate-200/50 py-2.5 px-4 md:px-0 sticky top-0 z-30 shadow-sm transition-colors duration-300">
      <div className="container mx-auto flex items-center justify-between gap-5">
        <Link to="/dashboard" className="flex items-center gap-2 group">
          <div className="w-8 h-8 bg-linear-to-br from-primary to-secondary rounded-lg flex items-center justify-center">
            <LuSparkles className="text-white text-lg" />
          </div>
          <h2 className="text-lg md:text-xl font-bold text-text-primary leading-5">
            Interview Trainer <span className="gradient-text-purple">AI</span>
          </h2>
        </Link>

        <div className="flex items-center gap-4">
          <LanguageSwitcher />
          <button
            onClick={toggleTheme}
            className="p-2 rounded-full hover:bg-bg-secondary text-text-secondary hover:text-primary dark:text-text-tertiary transition-all cursor-pointer"
            aria-label="Toggle theme"
          >
            {theme === "dark" ? (
              <LuSun className="text-xl" />
            ) : (
              <LuMoon className="text-xl" />
            )}
          </button>
          <ProfileInfoCard />
        </div>
      </div>
    </div>
  );
};

export default Navbar;

import { useState, useRef } from "react";
import { useOutsideClick } from "../../hooks/useOutsideClick";
import { useTranslation } from "react-i18next";
import { useTheme } from "../../hooks/useTheme";
import { useUser } from "../../hooks/useUser";
import { LuGlobe, LuSun, LuMoon, LuLogOut } from "react-icons/lu";
import { AnimatePresence, motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

interface ProfileInfoCardProps {
  className?: string;
  compact?: boolean; // render a non-interactive inline header (for mobile menu)
  onClose?: () => void; // callback to close parent menus (mobile menu)
}

const ProfileInfoCard = ({
  className = "",
  compact = false,
  onClose,
}: ProfileInfoCardProps) => {
  const { t, i18n } = useTranslation();
  const { theme, setTheme } = useTheme();
  const { user, logout } = useUser();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
    setIsOpen(false);
  };

  const changeLanguage = (lang: string) => {
    i18n.changeLanguage(lang);
    setIsOpen(false);
  };

  const handleLogout = async () => {
    await logout();
    navigate("/");
    setIsOpen(false);
    if (onClose) onClose();
  };

  useOutsideClick(dropdownRef, () => {
    if (!compact) {
      setIsOpen(false);
    }
  });

  if (compact) {
    return (
      <div className={`flex items-center justify-between ${className}`}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full overflow-hidden border border-slate-200 dark:border-slate-700 shadow-sm shrink-0">
            <img
              src={`https://api.dicebear.com/9.x/bottts/svg?seed=${user?._id}&backgroundColor=c0aede,b6e3f4,ffdfbf,ffd5dc,d1d4f9`}
              alt={user?.name}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="flex flex-col">
            <div className="text-sm font-medium text-text-primary">
              {user?.name}
            </div>
            <button
              onClick={handleLogout}
              className="text-xs text-primary font-medium cursor-pointer hover:underline flex items-center gap-1"
            >
              <LuLogOut className="w-3 h-3" /> {t("nav.logout")}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Avatar Button */}
      <button
        onClick={() => {
          if (typeof window !== "undefined" && window.innerWidth >= 768) return;
          setIsOpen(!isOpen);
        }}
        className={`group flex items-center justify-center gap-2 p-2 rounded-full transition-all cursor-pointer ${className}`}
        aria-expanded={isOpen}
        aria-haspopup="menu"
      >
        <div className="w-9 h-9 rounded-full overflow-hidden shrink-0">
          <img
            src={`https://api.dicebear.com/9.x/bottts/svg?seed=${user?._id}&backgroundColor=c0aede,b6e3f4,ffdfbf,ffd5dc,d1d4f9`}
            alt={user?.name}
            className="w-full h-full object-cover"
          />
        </div>
        {/* Desktop: Show name and logout */}
        <div className="hidden md:block">
          <div
            className={`text-sm font-medium leading-tight dark:group-hover:text-white ${className}`}
          >
            {user?.name}
          </div>
          <div
            className="text-xs text-primary font-medium cursor-pointer hover:underline flex items-center gap-1 group"
            onClick={handleLogout}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === "Enter" && handleLogout()}
          >
            <LuLogOut className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
            {t("nav.logout")}
          </div>
        </div>
      </button>
      {/* Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ duration: 0.3 }}
            className="absolute right-0 top-full mt-2 bg-white/80 dark:bg-bg-secondary backdrop-blur-md rounded-lg shadow-lg border border-border-primary min-w-[180px] z-50 overflow-hidden md:hidden"
            role="menu"
            aria-label={t("menu.user")}
          >
            {/* Mobile header removed - keep navbar avatar visible to avoid duplication */}
            {/* Language Inline */}
            <div className="px-4 py-3 border-b border-border-primary">
              <div className="flex items-center gap-2 mb-2">
                <LuGlobe className="w-4 h-4 text-text-secondary" />
                <span className="text-sm font-medium text-text-primary">
                  {t("language.select")}
                </span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => changeLanguage("en")}
                  className={`flex-1 px-3 py-1.5 text-sm rounded-md transition-colors ${
                    i18n.language?.split("-")[0] === "en"
                      ? "bg-primary text-white"
                      : "bg-bg-tertiary text-text-secondary hover:bg-bg-secondary"
                  }`}
                >
                  EN
                </button>
                <button
                  onClick={() => changeLanguage("fr")}
                  className={`flex-1 px-3 py-1.5 text-sm rounded-md transition-colors ${
                    i18n.language?.split("-")[0] === "fr"
                      ? "bg-primary text-white"
                      : "bg-bg-tertiary text-text-secondary hover:bg-bg-secondary"
                  }`}
                >
                  FR
                </button>
              </div>
            </div>
            {/* Menu Items */}
            {[
              {
                icon: theme === "dark" ? LuSun : LuMoon,
                label: theme === "dark" ? t("theme.light") : t("theme.dark"),
                onClick: toggleTheme,
              },
              {
                icon: LuLogOut,
                label: t("nav.logout"),
                onClick: handleLogout,
              },
            ].map((item, index) => (
              <motion.button
                key={index}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05, duration: 0.2 }}
                onClick={item.onClick}
                className="w-full text-left px-4 py-3 text-sm hover:bg-bg-tertiary transition-all flex items-center gap-3 hover:-translate-y-px text-text-primary"
                role="menuitem"
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ProfileInfoCard;

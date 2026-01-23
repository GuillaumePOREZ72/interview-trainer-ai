import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useUser } from "../../hooks/useUser";
import { LuLogOut } from "react-icons/lu";

const ProfileInfoCard = ({ className = "" }: { className?: string }) => {
  const { t } = useTranslation();
  const { user, clearUser } = useUser();
  const navigate = useNavigate();

  const handleLogout = () => {
    clearUser();
    navigate("/");
  };

  return (
    user && (
      <div className="flex items-center justify-center gap-2">
        {/* Avatar */}
        <div className="w-9 h-9 rounded-full overflow-hidden border border-slate-200 dark:border-slate-700 shadow-sm shrink-0">
          <img
            src={`https://api.dicebear.com/9.x/notionists/svg?seed=${user._id}&backgroundColor=c0aede,b6e3f4,ffdfbf,ffd5dc,d1d4f9`}
            alt={user.name}
            className="w-full h-full object-cover"
          />
        </div>

        {/* User Info */}
        <div className="hidden md:block">
          {" "}
          <div
            className={`text-sm font-medium leading-tight text-text-primary ${className}`}
          >
            {user.name}
          </div>
          <button
            className="text-xs text-primary font-medium cursor-pointer hover:underline flex items-center gap-1 group"
            onClick={handleLogout}
          >
            <LuLogOut className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
            {t("nav.logout")}
          </button>
        </div>
        {/* Mobile Logout Button */}
        <button
          className="md:hidden text-slate-600 hover:text-primary transition-colors"
          onClick={handleLogout}
          aria-label={t("nav.logout")}
        >
          <LuLogOut className="w-4 h-4" />
        </button>
      </div>
    )
  );
};

export default ProfileInfoCard;

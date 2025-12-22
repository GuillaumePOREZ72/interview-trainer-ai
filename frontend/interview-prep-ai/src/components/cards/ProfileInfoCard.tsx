import { useNavigate } from "react-router-dom";
import { useUser } from "../../hooks/useUser";
import { getInitials } from "../../utils/helper";
import { LuLogOut, LuUser } from "react-icons/lu";

const ProfileInfoCard = () => {
  const { user, clearUser } = useUser();
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.clear();
    clearUser();
    navigate("/");
  };

  return (
    user && (
      <div className="flex items-center justify-center gap-2">
        {/* Avatar */}
        {user.profileImageUrl ? (
          <img
            src={user.profileImageUrl}
            alt={user.name || "User avatar"}
            className="w-9 h-9 rounded-full object-cover ring-2 ring-slate-100"
          />
        ) : (
          <div className="w-9 h-9 bg-linear-to-br from-primary to-secondary rounded-full flex items-center justify-center">
            <span className="text-sm font-bold text-white">
              {getInitials(user.name)}
            </span>
          </div>
        )}

        {/* User Info */}
        <div className="hidden md:block">
          {" "}
          <div className="text-sm text-slate-900 font-semibold leading-tight">
            {user.name}
          </div>
          <button
            className="text-xs text-primary font-medium cursor-pointer hover:underline flex items-center gap-1 group"
            onClick={handleLogout}
          >
            <LuLogOut className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
            Logout
          </button>
        </div>
        {/* Mobile Logout Button */}
        <button
          className="md:hidden text-slate-600 hover:text-primary transition-colors"
          onClick={handleLogout}
        >
          <LuLogOut className="w-4 h-4" />
        </button>
      </div>
    )
  );
};

export default ProfileInfoCard;

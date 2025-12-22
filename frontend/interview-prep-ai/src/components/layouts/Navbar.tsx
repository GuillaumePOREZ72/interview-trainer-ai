import ProfileInfoCard from "../cards/ProfileInfoCard";
import { Link } from "react-router-dom";
import { LuSparkles } from "react-icons/lu";

const Navbar = () => {
  return (
    <div className="h-16 bg-white/80 backdrop-blur-md border-b border-slate-200/50 py-2.5 px-4 md:px-0 sticky top-0 z-30 shadow-sm">
      <div className="container mx-auto flex items-center justify-between gap-5">
        <Link to="/dashboard" className="flex items-center gap-2 group">
          <div className="w-8 h-8 bg-linear-to-br from-primary to-secondary rounded-lg flex items-center justify-center">
            <LuSparkles className="text-white text-lg"/>
          </div>
          <h2 className="text-lg md:text-xl font-bold text-slate-900 leading-5">
            Interview Trainer <span className="gradient-text-purple">AI</span>
          </h2>
        </Link>
        <ProfileInfoCard />
      </div>
    </div>
  );
};

export default Navbar;

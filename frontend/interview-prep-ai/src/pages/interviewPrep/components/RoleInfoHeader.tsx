import {
  LuBriefcase,
  LuClock,
  LuMessageSquare,
  LuCalendar,
} from "react-icons/lu";
interface RoleInfoHeaderProps {
  role: string;
  topicsToFocus: string;
  experience: number;
  questions: number;
  description?: string;
  lastUpdated: string;
}

const RoleInfoHeader = ({
  role,
  topicsToFocus,
  experience,
  questions,
  lastUpdated,
}: RoleInfoHeaderProps) => {
  return (
    <div className="bg-linear-to-br from-slate-50 via-indigo-50/30 to-purple-50/30 border-b border-slate-200/50 relative overflow-hidden">
      {/* Animated gradient blobs */}
      <div className="absolute top-0 right-0 w-96 h-full">
        <div className="w-32 h-32 bg-indigo-400/50 blur-[80px] absolute top-10 right-20 animate-blob1" />
        <div className="w-28 h-28 bg-purple-400/50 blur-[70px] absolute top-20 right-40 animate-blob2" />
        <div className="w-24 h-24 bg-cyan-400/50 blur-[60px] absolute top-32 right-10 animate-blob3" />
      </div>

      <div className="container mx-auto px-4 md:px-0 py-8 relative z-10">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          {/* Left side - Role Info */}
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 bg-linear-to-br from-primary to-secondary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
                <LuBriefcase className="text-white text-xl" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-slate-900">
                  {role}
                </h1>
                <p className="text-sm font-medium text-slate-600 mt-0.5">
                  {topicsToFocus}
                </p>
              </div>
            </div>
          </div>

          {/* Right side - Stats */}
          <div className="flex flex-wrap gap-2">
            <div className="flex items-center gap-2 bg-white/80 backdrop-blur-sm border border-slate-200 rounded-lg px-3 py-2 shadow-sm">
              <LuClock className="w-4 h-4 text-secondary" />
              <span className="text-xs font-semibold text-slate-700">
                {experience} {experience === 1 ? "Year" : "Years"}
              </span>
            </div>
            <div className="flex items-center gap-2 bg-white/80 backdrop-blur-sm border border-slate-200 rounded-lg px-3 py-2 shadow-sm">
              <LuMessageSquare className="w-4 h-4 text-primary" />
              <span className="text-xs font-semibold text-slate-700">
                {questions} Q&A
              </span>
            </div>
            <div className="flex items-center gap-2 bg-white/80 backdrop-blur-sm border border-slate-200 rounded-lg px-3 py-2 shadow-sm">
              <LuCalendar className="w-4 h-4 text-accent" />
              <span className="text-xs font-semibold text-slate-700">
                Updated {lastUpdated}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoleInfoHeader;

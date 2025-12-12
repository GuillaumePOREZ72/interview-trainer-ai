import { LuTrash2, LuCalendar, LuMessageSquare } from "react-icons/lu";
import { getInitials } from "../../utils/helper";

interface SummaryCardProps {
  role: string;
  topicsToFocus: string;
  experience: number;
  questions: number;
  description: string;
  lastUpdated: string;
  onSelect: () => void;
  onDelete: () => void;
}

const SummaryCard = ({
  role,
  topicsToFocus,
  experience,
  questions,
  description,
  lastUpdated,
  onSelect,
  onDelete,
}: SummaryCardProps) => {
  return (
    <div
      className="bg-white/80 backdrop-blur-sm border border-slate-200/50 rounded-xl overflow-hidden cursor-pointer hover:shadow-xl hover:shadow-primary/10 hover:-translate-y-1 transition-all duration-300 group relative"
      onClick={onSelect}
    >
      {/* Header with gradient */}
      <div className="bg-linear-to-br from-indigo-50 via-purple-50 to-cyan-50 p-5 relative">
        <div className="flex items-start gap-4">
          <div className="shrink-0 w-12 h-12 bg-linear-to-br from-primary to-secondary rounded-lg flex items-center justify-center shadow-lg shadow-primary/20">
            <span className="text-lg font-bold text-white">
              {getInitials(role)}
            </span>
          </div>

          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-semibold text-slate-900 mb-1 truncate">
              {role}
            </h2>
            <p className="text-xs font-medium text-indigo-600 truncate">
              {topicsToFocus}
            </p>
          </div>
        </div>

        {/* Delete button */}
        <button
          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center gap-1.5 text-xs text-red-600 font-medium bg-red-50 px-3 py-1.5 rounded-lg border border-red-200 hover:bg-red-100 hover:border-red-300"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
        >
          <LuTrash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Content */}
      <div className="p-5">
        {/* Description */}
        <p className="text-sm text-slate-600 line-clamp-2 mb-4 leading-relaxed">
          {description || "No description provided"}
        </p>

        {/* Stats */}
        <div className="flex flex-wrap gap-2 mb-4">
          <div className="flex items-center gap-1.5 text-xs font-medium text-slate-700 bg-slate-100 px-3 py-1.5 rounded-lg">
            <LuMessageSquare className="w-3.5 h-3.5 text-primary" />
            {questions} {questions === 1 ? "Question" : "Questions"}
          </div>
          <div className="flex items-center gap-1.5 text-xs font-medium text-slate-700 bg-slate-100 px-3 py-1.5 rounded-lg">
            <span className="text-secondary">📚</span>
            {experience} {experience === 1 ? "Year" : "Years"}
          </div>
        </div>

        {/* Last updated */}
        <div className="flex items-center gap-1.5 text-xs text-slate-500 pt-3 border-t border-slate-100">
          <LuCalendar className="w-3.5 h-3.5" />
          Updated {lastUpdated}
        </div>
      </div>
    </div>
  );
};

export default SummaryCard;

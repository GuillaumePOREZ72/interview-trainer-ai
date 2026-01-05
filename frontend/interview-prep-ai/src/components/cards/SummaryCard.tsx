import { useTranslation } from "react-i18next";
import { LuTrash2, LuCalendar, LuMessageSquare } from "react-icons/lu";
import { getInitials } from "../../utils/helper";
import { formatDate } from "../../utils/formatDate";

interface SummaryCardProps {
  role: string;
  topicsToFocus: string;
  experience: number;
  questions: number;
  description: string;
  language?: string;
  lastUpdated?: string | null;
  onSelect: () => void;
  onDelete: () => void;
}

const SummaryCard = ({
  role,
  topicsToFocus,
  experience,
  questions,
  description,
  language = "en",
  lastUpdated,
  onSelect,
  onDelete,
}: SummaryCardProps) => {
  const { t } = useTranslation();

  const formattedDate = formatDate(lastUpdated);

  return (
    <div
      className="bg-bg-primary/80 backdrop-blur-sm border border-border-primary rounded-xl overflow-hidden cursor-pointer hover:shadow-xl hover:shadow-primary/10 hover:-translate-y-1 transition-all duration-300 group relative"
      onClick={onSelect}
    >
      {/* Header with gradient */}
      <div className="bg-linear-to-br from-indigo-50 via-purple-50 to-cyan-50 dark:from-indigo-950/30 dark:via-purple-950/30 dark:to-cyan-950/30 p-5 relative border-b border-border-primary">
        <div className="flex items-start gap-4">
          <div className="shrink-0 w-12 h-12 bg-linear-to-br from-primary to-secondary rounded-lg flex items-center justify-center shadow-lg shadow-primary/20">
            <span className="text-lg font-bold text-white">
              {getInitials(role)}
            </span>
          </div>

          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-semibold text-text-primary mb-1 truncate">
              {role}
            </h2>
            <p className="text-xs font-medium text-primary truncate">
              {topicsToFocus}
            </p>
          </div>

          {/* Language badge */}
          <span className="shrink-0 text-xs font-medium px-2 py-1 rounded-md bg-bg-tertiary border border-border-primary text-text-secondary mt-6">
            {language === "fr" ? "🇫🇷 FR" : "🇬🇧 EN"}
          </span>
        </div>

        {/* Delete button */}
        <button
          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center gap-1.5 text-xs text-red-600 dark:text-red-400 font-medium bg-red-50 dark:bg-red-900/20 px-3 py-1.5 rounded-lg border border-red-200 dark:border-red-800 hover:bg-red-100 dark:hover:bg-red-900/40 hover:border-red-300 cursor-pointer"
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
        <p className="text-sm text-text-secondary line-clamp-2 mb-4 leading-relaxed">
          {description || t("sessionCard.noDescription")}
        </p>

        {/* Stats */}
        <div className="flex flex-wrap gap-2 mb-4">
          <div className="flex items-center gap-1.5 text-xs font-medium text-text-secondary bg-bg-tertiary px-3 py-1.5 rounded-lg border border-transparent hover:border-border-primary transition-colors">
            <LuMessageSquare className="w-3.5 h-3.5 text-primary" />
            {t("sessionCard.questions", { count: questions })}
          </div>
          <div className="flex items-center gap-1.5 text-xs font-medium text-text-secondary bg-bg-tertiary px-3 py-1.5 rounded-lg border border-transparent hover:border-border-primary transition-colors">
            <span className="text-secondary">📚</span>
            {t("sessionCard.years", { count: experience })}
          </div>
        </div>

        {/* Last updated */}
        <div className="flex items-center gap-1.5 text-xs text-text-secondary pt-3 border-t border-border-primary">
          <LuCalendar className="w-3.5 h-3.5" />
          {t("sessionCard.updated", { date: formattedDate })}
        </div>
      </div>
    </div>
  );
};

export default SummaryCard;

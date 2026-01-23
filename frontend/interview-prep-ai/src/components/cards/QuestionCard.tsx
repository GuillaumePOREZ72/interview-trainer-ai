import { motion, AnimatePresence } from "framer-motion";
import { LuChevronDown, LuPin, LuPinOff, LuSparkles } from "react-icons/lu";
import AIResponsePreview from "../../pages/interviewPrep/components/AIResponsePreview";
import { useTranslation } from "react-i18next";

interface QuestionCardProps {
  question: string;
  answer: string;
  onLearnMore: () => void;
  isPinned: boolean;
  isOpen?: boolean;
  onTogglePin: () => void;
  onToggleOpen?: () => void;
}

const QuestionCard = ({
  question,
  answer,
  onLearnMore,
  isPinned,
  onTogglePin,
  isOpen,
  onToggleOpen,
}: QuestionCardProps) => {
  const { t } = useTranslation();

  const toggleExpand = () => {
    onToggleOpen?.();
  };

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-xl mb-4 overflow-hidden py-4 px-5 shadow-lg hover:shadow-xl border border-border-primary  transition-all duration-300 group">
      <div className="flex items-start justify-between cursor-pointer">
        <div className="flex items-center gap-3 flex-1" onClick={toggleExpand}>
          <div className="shrink-0 w-8 h-8 bg-linear-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/50 dark:to-purple-900/50 rounded-lg flex items-center justify-center mt-0.5">
            <span className="text-sm font-bold text-primary">
              {t("question.badge")}
            </span>
          </div>
          <h3
            className="text-sm md:text-base font-medium text-black leading-relaxed flex-1"
            onClick={toggleExpand}
          >
            {question}
          </h3>
        </div>

        <div className="flex items-center gap-2 ml-4 shrink-0">
          {/* Actions */}
          <div
            className={`flex items-center gap-2 ${
              isOpen ? "flex" : "hidden group-hover:flex"
            }`}
          >
            {/* Pin Button */}
            <button
              className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition-all duration-200 cursor-pointer ${
                isPinned
                  ? "bg-primary text-white shadow-md shadow-primary/30"
                  : "bg-bg-secondary hover:bg-bg-tertiary"
              }`}
              onClick={(e) => {
                e.stopPropagation();
                onTogglePin();
              }}
            >
              {isPinned ? (
                <LuPinOff className="w-3.5 h-3.5" />
              ) : (
                <LuPin className="w-3.5 h-3.5" />
              )}
            </button>

            {/* Learn More Button */}
            <button
              className="flex items-center gap-1.5 text-xs text-white font-medium bg-linear-to-r from-accent to-cyan-600 px-3 py-1.5 mr-2 rounded-lg hover:shadow-lg hover:shadow-accent/30 transition-all duration-200 cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                onLearnMore();
              }}
            >
              <LuSparkles className="w-3.5 h-3.5" />
              <span className="hidden md:inline">
                {t("question.learnMore")}
              </span>
            </button>
          </div>

          {/* Expand/Collapse Button */}
          <button
            className="text-text-tertiary hover:text-text-secondary transition-colors cursor-pointer"
            onClick={toggleExpand}
          >
            <LuChevronDown
              size={20}
              className={`transform transition-transform duration-300 ${
                isOpen ? "rotate-180" : ""
              }`}
            />
          </button>
        </div>
      </div>

      {/* Answer Content (animated with framer-motion) */}
      <AnimatePresence initial={false} mode="wait">
        {isOpen && (
          <motion.div
            key="answer"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.28, ease: [0.2, 0.8, 0.2, 1] }}
            className="overflow-hidden"
          >
            <div className="pt-4">
              <div className="bg-bg-secondary rounded-xl p-4 border border-border-primary">
                <AIResponsePreview content={answer} />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default QuestionCard;

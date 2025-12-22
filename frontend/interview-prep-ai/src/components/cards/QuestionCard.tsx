import { useEffect, useRef, useState } from "react";
import { LuChevronDown, LuPin, LuPinOff, LuSparkles } from "react-icons/lu";
import AIResponsePreview from "../../pages/interviewPrep/components/AIResponsePreview";

interface QuestionCardProps {
  question: string;
  answer: string;
  onLearnMore: () => void;
  isPinned: boolean;
  onTogglePin: () => void;
}

const QuestionCard = ({
  question,
  answer,
  onLearnMore,
  isPinned,
  onTogglePin,
}: QuestionCardProps) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [height, setHeight] = useState<number>(0);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isExpanded && contentRef.current) {
      const contentHeight = contentRef.current.scrollHeight;
      setHeight(contentHeight + 10);
    } else {
      setHeight(0);
    }
  }, [isExpanded]);

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-xl mb-4 overflow-hidden py-4 px-5 shadow-lg hover:shadow-xl border border-border-primary  transition-all duration-300 group">
      <div className="flex items-start justify-between cursor-pointer">
        <div className="flex items-center gap-3 flex-1" onClick={toggleExpand}>
          <div className="shrink-0 w-8 h-8 bg-linear-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/50 dark:to-purple-900/50 rounded-lg flex items-center justify-center mt-0.5">
            <span className="text-sm font-bold text-primary">Q</span>
          </div>
          <h3
            className="text-sm md:text-base font-medium text-text-primary dark:text-text-tertiary leading-relaxed flex-1"
            onClick={toggleExpand}
          >
            {question}
          </h3>
        </div>

        <div className="flex items-center gap-2 ml-4 shrink-0">
          {/* Actions */}
          <div
            className={`flex items-center gap-2 ${
              isExpanded ? "flex" : "hidden group-hover:flex"
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
                setIsExpanded(true);
                onLearnMore();
              }}
            >
              <LuSparkles className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Learn More</span>
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
                isExpanded ? "rotate-180" : ""
              }`}
            />
          </button>
        </div>
      </div>

      {/* Answer Content */}
      <div
        ref={contentRef}
        style={{ height: `${height}px` }}
        className="transition-all duration-300 ease-in-out overflow-hidden"
      >
        <div className="pt-4 pl-11 pr-4">
          <div className="bg-bg-secondary rounded-xl p-4 border border-border-primary">
            <AIResponsePreview content={answer} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuestionCard;

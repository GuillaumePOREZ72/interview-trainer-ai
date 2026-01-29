import { useState, useRef } from "react";
import { useTranslation } from "react-i18next";
import { LuGlobe, LuCheck } from "react-icons/lu";
import { useOutsideClick } from "../hooks/useOutsideClick";

interface Language {
  code: string;
  label: string;
}

interface LanguageSwitcherProps {
  className?: string;
}

const LanguageSwitcher = ({ className = "" }: LanguageSwitcherProps) => {
  const { i18n, t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const languages: Language[] = [
    { code: "en", label: t("language.en") },
    { code: "fr", label: t("language.fr") },
  ];

  const currentLanguage = languages.find(
    (lang) => lang.code === i18n.language?.split("-")[0],
  );

  const changeLanguage = (langCode: string) => {
    i18n.changeLanguage(langCode);
    setIsOpen(false);
  };

  useOutsideClick(dropdownRef, () => setIsOpen(false));

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 p-2 rounded-full hover:bg-bg-secondary text-text-primary hover:text-primary transition-all cursor-pointer ${className}`}
        aria-label={t("language.select")}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        <LuGlobe className="text-xl" />
        <span className="text-sm font-medium hidden md:inline">
          {currentLanguage?.label || "EN"}
        </span>
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div
          className="absolute right-0 top-full mt-2 bg-white dark:bg-bg-secondary rounded-lg shadow-lg border border-border-primary min-w-[140px] z-50 overflow-hidden"
          role="menu"
          aria-label={t("language.select")}
        >
          {languages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => changeLanguage(lang.code)}
              role="menuitem"
              className={`w-full text-left px-4 py-2.5 text-sm hover:bg-bg-tertiary transition-colors flex items-center justify-between gap-2 ${
                i18n.language?.split("-")[0] === lang.code
                  ? "text-primary font-semibold bg-primary/5"
                  : "text-text-secondary"
              }`}
            >
              <span>{lang.label}</span>
              {i18n.language?.split("-")[0] === lang.code && (
                <LuCheck aria-hidden="true" className="w-4 h-4 text-primary" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default LanguageSwitcher;

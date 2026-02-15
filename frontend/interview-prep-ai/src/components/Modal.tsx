import { ReactNode, useEffect } from "react";
import { LuX } from "react-icons/lu";

interface ModalProps {
  children: ReactNode;
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  hideHeader?: boolean;
}

const Modal = ({
  children,
  isOpen,
  onClose,
  title,
  hideHeader = false,
}: ModalProps) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const isDark = document.documentElement.classList.contains("dark");

  return (
    <div className="fixed inset-0 z-50 flex justify-center items-center w-full h-full bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={!hideHeader ? "modal-title" : undefined}
        className={`relative flex flex-col shadow-2xl rounded-2xl overflow-hidden max-h-[90vh] animate-in zoom-in-95 duration-200 ${
          isDark ? "bg-[#1f2937]" : "bg-white"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {!hideHeader && (
          <div
            className={`flex items-center justify-between p-5 border-b ${
              isDark ? "border-gray-700" : "border-slate-200"
            }`}
          >
            <h3
              id="modal-title"
              className={`text-xl font-bold ${
                isDark ? "text-white" : "text-slate-900"
              }`}
            >
              {title}
            </h3>
          </div>
        )}

        <button
          type="button"
          aria-label="Close modal"
          className={`absolute top-4 right-4 rounded-lg text-sm w-9 h-9 flex items-center justify-center transition-all duration-200 shadow-sm hover:shadow-md z-10 ${
            isDark
              ? "bg-gray-700 text-gray-400 hover:bg-gray-600 hover:text-white"
              : "bg-white text-slate-400 hover:bg-slate-100 hover:text-slate-900"
          }`}
          onClick={onClose}
        >
          <LuX className="w-5 h-5" />
        </button>

        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;

import { ReactNode } from "react";
import { LuX} from "react-icons/lu";

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
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-center items-center w-full h-full bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      {/* Modal Content */}
      <div
        className="relative flex flex-col bg-white shadow-2xl rounded-2xl overflow-hidden max-h-[90vh] animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        {!hideHeader && (
          <div className="flex items-center justify-between p-5 border-b border-slate-200 bg-linear-to-r from-slate-50 to-white">
            <h3 className="text-xl font-bold text-slate-900">{title}</h3>
          </div>
        )}

        <button
          type="button"
          className="absolute top-4 right-4 text-slate-400 bg-white hover:bg-slate-100 hover:text-slate-900 rounded-lg text-sm w-9 h-9 flex items-center justify-center transition-all duration-200 shadow-sm hover:shadow-md z-10"
          onClick={onClose}
        >
          <LuX className="w-5 h-5" />
        </button>

        {/*Modal Body (scrollable) */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;

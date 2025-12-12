import { LuTriangleAlert } from "react-icons/lu";

interface DeleteAlertContentProps {
  content: string;
  onDelete: () => void;
}

const DeleteAlertContent = ({ content, onDelete }: DeleteAlertContentProps) => {
  return (
    <div className="p-6">
      {/* Warning Icon */}
      <div className="flex items-center justify-center mb-4">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
          <LuTriangleAlert className="text-red-600 w-8 h-8" />
        </div>
      </div>
      {/* Content */}
      <p className="text-sm text-slate-700 text-center mb-6 leading-relaxed">
        {content}
      </p>

      {/* Actions */}
      <div className="flex justify-end gap-3">
        <button
          type="button"
          className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
          onClick={() => {}}
        >
          Cancel
        </button>
        <button
          type="button"
          className="px-4 py-2 text-sm font-semibold text-white bg-linear-to-r from-red-600 to-red-700 rounded-lg hover:shadow-lg hover:shadow-red-500/30 hovr:scale-[1.02] transition-all duration-200"
          onClick={onDelete}
        >
          Yes, Delete
        </button>
      </div>
    </div>
  );
};

export default DeleteAlertContent;

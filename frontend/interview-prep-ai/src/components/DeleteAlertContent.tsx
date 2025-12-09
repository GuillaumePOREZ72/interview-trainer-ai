interface DeleteAlertContentProps {
  content: string;
  onDelete: () => void;
}

const DeleteAlertContent = ({ content, onDelete }: DeleteAlertContentProps) => {
  return (
    <div className="p-5">
      <p className="text-[14px]">{content}</p>

      <div className="flex justify-end mt-6">
        <button type="button" className="btn-small" onClick={onDelete}>
          Yes, Delete
        </button>
      </div>
    </div>
  );
};

export default DeleteAlertContent;

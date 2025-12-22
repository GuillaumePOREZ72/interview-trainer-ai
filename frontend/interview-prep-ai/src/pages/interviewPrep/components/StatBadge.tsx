const StatBadge = ({
  icon,
  label,
}: {
  icon: React.ReactNode;
  label: string;
}) => (
  <div className="flex items-center gap-2 bg-bg-primary/60 backdrop-blur-md border border-border-primary rounded-lg px-3.5 py-2 shadow-sm hover:shadow-md transition-all duration-200 hover:bg-bg-primary">
    {icon}
    <span className="text-xs font-semibold text-text-secondary">{label}</span>
  </div>
);
export default StatBadge;
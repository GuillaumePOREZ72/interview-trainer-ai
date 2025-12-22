import {
  LuBriefcase,
  LuClock,
  LuMessageSquare,
  LuCalendar,
} from "react-icons/lu";
import StatBadge from "./StatBadge";
interface RoleInfoHeaderProps {
  role: string;
  topicsToFocus: string;
  experience: number;
  questions: number;
  description?: string;
  lastUpdated: string;
}

const RoleInfoHeader = ({
  role,
  topicsToFocus,
  experience,
  questions,
  lastUpdated,
}: RoleInfoHeaderProps) => {
  return (
    <div className="relative border-b border-border-primary bg-bg-secondary overflow-hidden transition-colors duration-300">
      {/* Grid Pattern Overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-size[24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />

      {/* Aurora Blobs - Optimized for Dark/Light */}
      <div className="absolute top-0 right-0 w-[600px] h-full pointer-events-none opacity-30 dark:opacity-20">
        <div className="absolute top-[-20%] right-[-10%] w-[400px] h-[400px] bg-primary rounded-full blur-[120px] mix-blend-multiply dark:mix-blend-screen animate-pulse-slow" />
        <div className="absolute top-[20%] right-[20%] w-[300px] h-[300px] bg-secondary rounded-full blur-[100px] mix-blend-multiply dark:mix-blend-screen animate-pulse-slow delay-1000" />
        <div className="absolute bottom-[-10%] right-[10%] w-[250px] h-[250px] bg-accent rounded-full blur-[80px] mix-blend-multiply dark:mix-blend-screen animate-pulse-slow delay-2000" />
      </div>

      <div className="container mx-auto px-4 md:px-0 py-8 relative z-10">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          {/* Left side - Role Info */}
          <div className="flex-1">
            <div className="flex items-start gap-4">
              <div className="shrink-0 w-14 h-14 bg-linear-to-br from-primary to-secondary rounded-2xl flex items-center justify-center shadow-lg shadow-primary/20 ring-1 ring-white/20">
                <LuBriefcase className="text-white text-2xl" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-text-primary tracking-tight">
                  {role}
                </h1>
                <p className="text-sm md:text-base font-medium text-text-secondary mt-1 max-w-2xl">
                  {topicsToFocus}
                </p>
              </div>
            </div>
          </div>

          {/* Right side - Stats */}
          <div className="flex flex-wrap gap-3">
            <StatBadge
              icon={<LuClock className="w-4 h-4 text-secondary" />}
              label={`${experience} ${experience === 1 ? "Year" : "Years"}`}
            />
            <StatBadge
              icon={<LuMessageSquare className="w-4 h-4 text-primary" />}
              label={`${questions} Q&A`}
            />
            <StatBadge
              icon={<LuCalendar className="w-4 h-4 text-accent" />}
              label={`Updated ${lastUpdated}`}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoleInfoHeader;

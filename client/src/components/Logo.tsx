import { GraduationCap } from "lucide-react";

interface LogoProps {
  /** Render only the mark (icon), no wordmark text */
  iconOnly?: boolean;
  className?: string;
  /** Tailwind text-size for the wordmark, e.g. "text-2xl" */
  size?: string;
}

/**
 * Front Bench product mark. Used for platform chrome (login, landing, sidebar).
 * Note: this is the SaaS brand — a school's own name/logo comes from its tenant.
 */
export default function Logo({ iconOnly = false, className = "", size = "text-xl" }: LogoProps) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <span className="inline-flex items-center justify-center rounded-lg bg-blue-600 text-white p-1.5">
        <GraduationCap className="h-5 w-5" />
      </span>
      {!iconOnly && (
        <span className={`font-bold tracking-tight text-gray-900 ${size}`}>
          Frontbench<span className="text-blue-600">.io</span>
        </span>
      )}
    </span>
  );
}

import { cn } from "@/lib/cn";

/* The NRL People mark: four tilted bars, the same drawing as the login screen and app icon. */
export function Mark({ size = 28, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden className={className}>
      <g fill="currentColor" transform="rotate(-38 16 16)">
        <rect x="3" y="4" width="5" height="24" rx="2.5" />
        <rect x="10" y="4" width="5" height="24" rx="2.5" />
        <rect x="17" y="4" width="5" height="24" rx="2.5" />
        <rect x="24" y="4" width="5" height="24" rx="2.5" />
      </g>
    </svg>
  );
}

export function Wordmark({ className, sub }: { className?: string; sub?: string }) {
  return (
    <span className={cn("flex items-center gap-2.5", className)}>
      <Mark size={26} />
      <span className="leading-tight">
        <span className="block text-[15px] tracking-tight">
          NRL <b className="font-semibold">People</b>
        </span>
        {sub && <span className="block text-[12px] opacity-70">{sub}</span>}
      </span>
    </span>
  );
}

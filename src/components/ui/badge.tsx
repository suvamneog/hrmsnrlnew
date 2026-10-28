import { cn } from "@/lib/cn";

// One status palette for the app: green done, amber attention, red blocked, grey neutral, blue brand.
// peach and lilac are kept as names for older callers and map onto amber and blue.
export const TONES = {
  brand: "bg-brand-soft text-brand",
  ok: "bg-ok-soft text-ok",
  warn: "bg-warn-soft text-warn",
  danger: "bg-danger-soft text-danger",
  muted: "bg-fill text-muted",
  peach: "bg-warn-soft text-warn",
  lilac: "bg-brand-soft text-brand",
};
const tones = TONES;

export function Badge({
  children,
  tone = "muted",
  className,
}: {
  children: React.ReactNode;
  tone?: keyof typeof tones;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-2 py-0.5 text-[12px] font-medium",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

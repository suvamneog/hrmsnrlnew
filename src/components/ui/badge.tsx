import { cn } from "@/lib/cn";

// One status palette for the app: green done, amber attention, red blocked, grey neutral, blue brand.
// peach and lilac are kept as names for older callers and map onto amber and blue.
export const TONES = {
  brand: "bg-brand-soft text-brand",
  ok: "bg-[#eaf6ef] text-[#148f5b]",
  warn: "bg-[#fbf3e3] text-[#9a6a12]",
  danger: "bg-[#fdeded] text-[#c4373c]",
  muted: "bg-[#f2f2f0] text-[#6e6e73]",
  peach: "bg-[#fbf3e3] text-[#9a6a12]",
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

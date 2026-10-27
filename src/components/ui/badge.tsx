import { cn } from "@/lib/cn";

const tones = {
  brand: "bg-brand-soft text-brand",
  ok: "bg-[#e7f8ef] text-[#0f9f6e]",
  warn: "bg-[#fff4e0] text-[#c47b00]",
  danger: "bg-[#fdecec] text-[#d13b3b]",
  muted: "bg-[#eef1f6] text-muted",
  peach: "bg-[#fff1e6] text-[#e07a3d]",
  lilac: "bg-[#eeeaff] text-[#5b5bd6]",
};

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
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold tracking-wide",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

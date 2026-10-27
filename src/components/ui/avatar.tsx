import { initials } from "@/lib/format";
import { cn } from "@/lib/cn";

const TONES = ["#2f49d1", "#185fa5", "#0f6b5c", "#8a4b12", "#9a2942", "#3d3f8f"];

function tone(name: string) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 33 + name.charCodeAt(i)) >>> 0;
  return TONES[h % TONES.length];
}

export function Avatar({
  name,
  size = 40,
  className,
}: {
  name: string;
  size?: number;
  className?: string;
}) {
  return (
    <span
      aria-hidden
      className={cn("grid shrink-0 place-items-center rounded-full font-semibold text-white", className)}
      style={{ width: size, height: size, background: tone(name), fontSize: Math.max(11, Math.round(size * 0.36)) }}
    >
      {initials(name)}
    </span>
  );
}

export function AvatarStack({ names }: { names: string[] }) {
  return (
    <div className="flex -space-x-2">
      {names.slice(0, 4).map((n) => (
        <Avatar key={n} name={n} size={28} className="ring-2 ring-white" />
      ))}
      {names.length > 4 && (
        <span className="grid h-7 w-7 place-items-center rounded-full bg-brand-soft text-[10px] font-semibold text-brand ring-2 ring-white">
          {initials(names[4])}
        </span>
      )}
    </div>
  );
}

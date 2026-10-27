import { AnimatedTooltip } from "@/components/aceternity/animated-tooltip";
import { avatarUrl } from "@/lib/format";
import { cn } from "@/lib/cn";

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
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={avatarUrl(name)}
      alt={name}
      width={size}
      height={size}
      className={cn("rounded-full object-cover bg-[#efe9ff]", className)}
      style={{ width: size, height: size }}
    />
  );
}

export function AvatarStack({ names, size = 28 }: { names: string[]; size?: number }) {
  return (
    <div className="flex items-center pr-2">
      <AnimatedTooltip size={size} items={names.slice(0, 5).map((n, i) => ({ id: i, name: n, image: avatarUrl(n) }))} />
    </div>
  );
}

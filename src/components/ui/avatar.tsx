import { avatarUrl, initials } from "@/lib/format";
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

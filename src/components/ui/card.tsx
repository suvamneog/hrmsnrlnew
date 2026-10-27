import { cn } from "@/lib/cn";

export function Card({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "rounded-[18px] bg-white shadow-[0_10px_30px_rgba(45,64,180,0.07)]",
        className,
      )}
    >
      {children}
    </div>
  );
}

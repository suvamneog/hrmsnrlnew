import { cn } from "@/lib/cn";
import type { ReactNode } from "react";

export function ScrollFade({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "overflow-auto [mask-image:linear-gradient(to_bottom,transparent,black_14px,black_calc(100%-18px),transparent)]",
        className,
      )}
    >
      {children}
    </div>
  );
}

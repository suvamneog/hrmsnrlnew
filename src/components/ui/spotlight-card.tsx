"use client";

import { cn } from "@/lib/cn";
import { useReducedMotion } from "motion/react";
import { useRef, useState, type MouseEvent, type ReactNode } from "react";

export function SpotlightCard({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const [spot, setSpot] = useState({ x: 48, y: 32, on: false });

  function move(e: MouseEvent<HTMLDivElement>) {
    const box = ref.current?.getBoundingClientRect();
    if (!box) return;
    setSpot({ x: e.clientX - box.left, y: e.clientY - box.top, on: true });
  }

  return (
    <div
      ref={ref}
      onMouseMove={reduce ? undefined : move}
      onMouseLeave={() => setSpot((s) => ({ ...s, on: false }))}
      className={cn(
        "relative rounded-[18px] bg-white shadow-[0_10px_30px_rgba(45,64,180,0.07)]",
        className,
      )}
    >
      {!reduce && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 overflow-hidden rounded-[18px] transition-opacity duration-300"
          style={{
            opacity: spot.on ? 1 : 0,
            background: `radial-gradient(280px circle at ${spot.x}px ${spot.y}px, rgba(61,90,254,0.16), transparent 55%)`,
          }}
        />
      )}
      <div className="relative">{children}</div>
    </div>
  );
}

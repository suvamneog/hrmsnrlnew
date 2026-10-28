"use client";

import { cn } from "@/lib/cn";
import { useReducedMotion } from "motion/react";
import { useRef, useState } from "react";

const HOLD_MS = 900;

export function HoldToConfirm({
  label,
  doneLabel,
  onConfirm,
  disabled,
  variant = "primary",
  className,
}: {
  label: string;
  doneLabel?: string;
  onConfirm: () => void;
  disabled?: boolean;
  variant?: "primary" | "danger";
  className?: string;
}) {
  const reduce = useReducedMotion();
  const [pct, setPct] = useState(0);
  const [done, setDone] = useState(false);
  const raf = useRef<number>(0);
  const start = useRef(0);

  function stop() {
    cancelAnimationFrame(raf.current);
    start.current = 0;
  }

  function tick(now: number) {
    if (!start.current) start.current = now;
    const next = Math.min(1, (now - start.current) / (reduce ? 80 : HOLD_MS));
    setPct(next);
    if (next >= 1) {
      stop();
      setDone(true);
      onConfirm();
      window.setTimeout(() => {
        setDone(false);
        setPct(0);
      }, 1600);
      return;
    }
    raf.current = requestAnimationFrame(tick);
  }

  function down() {
    if (disabled || done) return;
    stop();
    setPct(0);
    raf.current = requestAnimationFrame(tick);
  }

  function up() {
    if (pct < 1) {
      stop();
      setPct(0);
    }
  }

  return (
    <button
      type="button"
      disabled={disabled || done}
      onPointerDown={down}
      onPointerUp={up}
      onPointerLeave={up}
      onPointerCancel={up}
      onContextMenu={(e) => e.preventDefault()}
      className={cn(
        "relative isolate h-11 min-w-[11rem] touch-none overflow-hidden rounded-lg px-4 text-sm font-semibold select-none",
        "outline-none focus-visible:ring-4 focus-visible:ring-brand/20",
        "disabled:pointer-events-none",
        variant === "danger"
          ? "border border-[#f3c1c1] bg-white text-danger"
          : "bg-brand text-white ",
        className,
      )}
    >
      <span
        className={cn(
          "absolute inset-0 origin-left",
          variant === "danger" ? "bg-[#fde8e8]" : "bg-brand-deep",
        )}
        style={{ transform: `scaleX(${pct})` }}
      />
      <span className="relative z-10">
        {done ? doneLabel ?? "Done" : label}
      </span>
    </button>
  );
}

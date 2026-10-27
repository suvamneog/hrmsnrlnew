"use client";

import { cn } from "@/lib/cn";
import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "white";

const styles: Record<Variant, string> = {
  primary:
    "bg-brand text-white shadow-[0_8px_18px_rgba(61,90,254,0.28)] hover:bg-brand-deep",
  secondary:
    "bg-white text-ink border border-line hover:bg-brand-soft hover:border-transparent",
  ghost: "bg-transparent text-ink hover:bg-brand-soft",
  danger: "bg-[#e14b4b] text-white hover:bg-[#c93c3c]",
  white: "bg-white/15 text-white hover:bg-white/25 border border-white/20",
};

export function Button({
  className,
  variant = "primary",
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-colors active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50",
        styles[variant],
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

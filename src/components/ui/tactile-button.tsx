"use client";

import { cn } from "@/lib/cn";
import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "danger" | "mint";

const LIP: Record<Variant, string> = {
  primary: "bg-[#2436c4]",
  secondary: "bg-[#c5cad8]",
  danger: "bg-[#b43333]",
  mint: "bg-[#0b7a54]",
};

const FACE: Record<Variant, string> = {
  primary: "bg-brand text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.28)]",
  secondary: "bg-white text-ink shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]",
  danger: "bg-[#e14b4b] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.22)]",
  mint: "bg-[#12a56f] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.28)]",
};

export function TactileButton({
  variant = "primary",
  className,
  children,
  disabled,
  type = "button",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return (
    <button
      type={type}
      disabled={disabled}
      className={cn(
        "group relative isolate inline-flex select-none rounded-[18px] pb-[6px] outline-none transition-[padding,transform] duration-75 ease-out",
        "hover:pb-[5px] hover:translate-y-px",
        "active:pb-[2px] active:translate-y-[4px]",
        "focus-visible:ring-4 focus-visible:ring-brand/20",
        "disabled:pointer-events-none disabled:opacity-45 disabled:active:pb-[6px] disabled:active:translate-y-0",
        LIP[variant],
        className,
      )}
      {...props}
    >
      <span
        className={cn(
          "relative flex min-h-12 w-full items-center justify-center gap-2 rounded-[18px] px-4 text-base font-semibold",
          FACE[variant],
        )}
      >
        {children}
      </span>
    </button>
  );
}

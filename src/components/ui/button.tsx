"use client";

import { buttonVariants } from "@/components/shadcn/button";
import { cn } from "@/lib/cn";
import { press } from "@/lib/motion";
import { motion, useReducedMotion, type HTMLMotionProps } from "motion/react";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "white";

// NRL colours over shadcn's button base (focus ring, disabled state, icon sizing).
const styles: Record<Variant, string> = {
  primary: "bg-brand text-white shadow-[0_6px_16px_rgba(61,90,254,0.26)] hover:bg-brand-deep hover:shadow-[0_10px_24px_rgba(61,90,254,0.32)]",
  secondary: "bg-white text-ink border border-line hover:bg-brand-soft hover:border-transparent",
  ghost: "bg-transparent text-ink hover:bg-brand-soft",
  danger: "bg-[#e14b4b] text-white hover:bg-[#c93c3c]",
  white: "bg-white/15 text-white hover:bg-white/25 border border-white/20",
};

const shadcnVariant: Record<Variant, "default" | "outline" | "ghost" | "destructive" | "secondary"> = {
  primary: "default",
  secondary: "outline",
  ghost: "ghost",
  danger: "destructive",
  white: "secondary",
};

export function Button({
  className,
  variant = "primary",
  children,
  ...props
}: HTMLMotionProps<"button"> & { variant?: Variant }) {
  const reduce = useReducedMotion();
  return (
    <motion.button
      whileHover={reduce || props.disabled ? undefined : { y: -1 }}
      whileTap={reduce || props.disabled ? undefined : { scale: 0.97, y: 0 }}
      transition={press}
      className={cn(
        buttonVariants({ variant: shadcnVariant[variant], size: "lg" }),
        "h-10 w-fit rounded-full px-5 text-sm font-semibold transition-[background-color,box-shadow,border-color,color] duration-200",
        styles[variant],
        className,
      )}
      {...props}
    >
      {children}
    </motion.button>
  );
}

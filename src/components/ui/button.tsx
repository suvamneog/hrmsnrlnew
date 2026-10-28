"use client";

import { buttonVariants } from "@/components/shadcn/button";
import { cn } from "@/lib/cn";
import { press } from "@/lib/motion";
import { motion, useReducedMotion, type HTMLMotionProps } from "motion/react";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "white";

// NRL colours over shadcn's button base (focus ring, disabled state, icon sizing).
// Flat fills and an 8px radius, in line with the cards: no gradients, no glow.
const styles: Record<Variant, string> = {
  primary: "bg-brand text-white hover:bg-brand-deep",
  secondary: "border border-line bg-white text-ink hover:bg-[#f7f7f5]",
  ghost: "bg-transparent text-ink hover:bg-[#f2f2f0]",
  danger: "bg-[#e5484d] text-white hover:bg-[#d23c41]",
  white: "border border-white/25 bg-white/15 text-white hover:bg-white/25",
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
      whileTap={reduce || props.disabled ? undefined : { scale: 0.98 }}
      transition={press}
      className={cn(
        buttonVariants({ variant: shadcnVariant[variant], size: "lg" }),
        "h-9 w-fit rounded-lg px-4 text-sm font-medium transition-colors duration-150",
        styles[variant],
        className,
      )}
      {...props}
    >
      {children}
    </motion.button>
  );
}

"use client";

import { buttonVariants } from "@/components/shadcn/button";
import { cn } from "@/lib/cn";
import { press } from "@/lib/motion";
import { motion, useReducedMotion, type HTMLMotionProps } from "motion/react";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "white";

// NRL colours over shadcn's button base (focus ring, disabled state, icon sizing).
// Apple-style capsules with flat fills: no gradients, no glow. Pressing shrinks to 0.97 at once.
const styles: Record<Variant, string> = {
  primary: "bg-brand text-white hover:bg-brand-deep",
  secondary: "border border-line bg-white text-ink hover:bg-subtle",
  ghost: "bg-transparent text-ink hover:bg-fill",
  danger: "bg-danger text-white hover:bg-danger",
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
      whileTap={reduce || props.disabled ? undefined : { scale: 0.97 }}
      transition={press}
      className={cn(
        buttonVariants({ variant: shadcnVariant[variant], size: "lg" }),
        "h-9 w-fit rounded-full px-[18px] text-sm font-medium tracking-[-0.01em] transition-colors duration-150 ease-out",
        styles[variant],
        className,
      )}
      {...props}
    >
      {children}
    </motion.button>
  );
}

"use client";

import { buttonVariants } from "@/components/shadcn/button";
import { cn } from "@/lib/cn";
import { press } from "@/lib/motion";
import { motion, useReducedMotion, type HTMLMotionProps } from "motion/react";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "white";

// NRL colours over shadcn's button base (focus ring, disabled state, icon sizing).
// Pill buttons with a soft top-to-bottom sheen, a hairline highlight on the top edge and a
// low diffuse shadow, so they read as lit glass rather than a flat fill.
const styles: Record<Variant, string> = {
  primary:
    "border border-[#2f49e0] bg-[linear-gradient(180deg,#5b74ff_0%,#3d5afe_55%,#3450f0_100%)] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.35),0_1px_2px_rgba(31,48,170,0.25),0_8px_20px_-6px_rgba(61,90,254,0.55)] hover:brightness-[1.06] hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.4),0_1px_2px_rgba(31,48,170,0.25),0_12px_28px_-8px_rgba(61,90,254,0.6)]",
  secondary:
    "border border-white bg-[linear-gradient(180deg,#ffffff_0%,#f1f3f8_100%)] text-ink shadow-[inset_0_1px_0_rgba(255,255,255,1),inset_0_-1px_0_rgba(20,30,90,0.05),0_0_0_1px_rgba(20,30,90,0.07),0_1px_2px_rgba(20,30,90,0.06),0_8px_18px_-8px_rgba(20,30,90,0.18)] hover:bg-[linear-gradient(180deg,#ffffff_0%,#eaedf5_100%)] hover:shadow-[inset_0_1px_0_rgba(255,255,255,1),inset_0_-1px_0_rgba(20,30,90,0.05),0_0_0_1px_rgba(20,30,90,0.09),0_1px_2px_rgba(20,30,90,0.06),0_12px_24px_-10px_rgba(20,30,90,0.22)]",
  ghost: "bg-transparent text-ink hover:bg-brand-soft",
  danger:
    "border border-[#c93c3c] bg-[linear-gradient(180deg,#f06464_0%,#e14b4b_55%,#d43f3f_100%)] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.3),0_1px_2px_rgba(150,30,30,0.25),0_8px_20px_-6px_rgba(225,75,75,0.5)] hover:brightness-[1.05]",
  white: "bg-white/15 text-white hover:bg-white/25 border border-white/20 shadow-[inset_0_1px_0_rgba(255,255,255,0.25)]",
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
      whileTap={reduce || props.disabled ? undefined : { scale: 0.96, y: 0 }}
      transition={press}
      className={cn(
        buttonVariants({ variant: shadcnVariant[variant], size: "lg" }),
        "h-10 w-fit rounded-full px-5 text-sm font-semibold tracking-[-0.01em] transition-[background,box-shadow,border-color,color,filter] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] disabled:shadow-none",
        styles[variant],
        className,
      )}
      {...props}
    >
      {children}
    </motion.button>
  );
}

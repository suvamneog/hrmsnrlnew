"use client";

import { cn } from "@/lib/cn";
import { motion, useReducedMotion, type Variants } from "motion/react";
import { Children, type ReactNode } from "react";

export type PresetType = "fade" | "slide" | "scale" | "blur" | "blur-slide" | "zoom";

export type AnimatedGroupProps = {
  children: ReactNode;
  className?: string;
  variants?: { container?: Variants; item?: Variants };
  preset?: PresetType;
  as?: React.ElementType;
  asChild?: React.ElementType;
};

const defaultItem: Variants = {
  hidden: {},
  visible: {},
};

const presets: Record<PresetType, Variants> = {
  fade: {},
  slide: { hidden: { y: 14 }, visible: { y: 0 } },
  scale: { hidden: { scale: 0.96 }, visible: { scale: 1 } },
  blur: { hidden: { filter: "blur(4px)" }, visible: { filter: "blur(0px)" } },
  "blur-slide": {
    hidden: { filter: "blur(6px)", y: 22 },
    visible: { filter: "blur(0px)", y: 0 },
  },
  zoom: {
    hidden: { scale: 0.92 },
    visible: { scale: 1, transition: { type: "spring", stiffness: 280, damping: 22 } },
  },
};

function mergeItem(extra: Variants): Variants {
  return {
    hidden: { ...defaultItem.hidden, ...extra.hidden },
    visible: { ...defaultItem.visible, ...extra.visible },
  };
}

export function AnimatedGroup({
  children,
  className,
  variants,
  preset = "slide",
  as = "div",
  asChild = "div",
}: AnimatedGroupProps) {
  const reduce = useReducedMotion();
  const MotionParent = motion[as as "div"];
  const MotionChild = motion[asChild as "div"];
  const item = variants?.item ?? mergeItem(presets[preset]);
  const container = variants?.container ?? {
    hidden: {},
    visible: { transition: { staggerChildren: 0.08 } },
  };

  if (reduce) return <div className={className}>{children}</div>;

  return (
    <MotionParent initial="hidden" animate="visible" variants={container} className={cn(className)}>
      {Children.map(children, (child) => (
        <MotionChild variants={item}>{child}</MotionChild>
      ))}
    </MotionParent>
  );
}

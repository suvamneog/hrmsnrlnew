"use client";

import { cn } from "@/lib/cn";
import { motion, useReducedMotion, useScroll, useSpring, type SpringOptions } from "motion/react";
import type { RefObject } from "react";

const SPRING: SpringOptions = { stiffness: 180, damping: 32, restDelta: 0.001 };

export function ScrollProgress({
  className,
  springOptions,
  containerRef,
}: {
  className?: string;
  springOptions?: SpringOptions;
  containerRef?: RefObject<HTMLElement | null>;
}) {
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll(containerRef ? { container: containerRef } : undefined);
  const scaleX = useSpring(scrollYProgress, { ...SPRING, ...springOptions });

  if (reduce) return null;

  return (
    <motion.div
      aria-hidden
      className={cn("h-[2px] origin-left bg-brand", className)}
      style={{ scaleX }}
    />
  );
}

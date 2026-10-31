"use client";

import { motion, useReducedMotion, type UseInViewOptions } from "motion/react";
import type { ReactNode } from "react";
import { easeOut } from "@/lib/motion";

/* The app's one reveal: a short fade when a block first scrolls into view. No rise, no blur. */
export function InView({
  children,
  className,
  delay = 0,
  viewOptions,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  viewOptions?: UseInViewOptions;
  as?: React.ElementType;
  once?: boolean;
}) {
  const reduce = useReducedMotion();
  if (reduce) return <div className={className}>{children}</div>;
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true, margin: "0px 0px -8% 0px", ...viewOptions }}
      transition={{ duration: 0.35, ease: easeOut, delay }}
    >
      {children}
    </motion.div>
  );
}

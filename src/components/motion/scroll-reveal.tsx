"use client";

import { cn } from "@/lib/cn";
import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import { useRef, type ReactNode } from "react";

export function ScrollReveal({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start 0.92", "start 0.45"],
  });
  const y = useTransform(scrollYProgress, [0, 1], [18, 0]);

  if (reduce) return <div className={className}>{children}</div>;

  return (
    <motion.div ref={ref} className={cn("will-change-transform", className)} style={{ y }}>
      {children}
    </motion.div>
  );
}

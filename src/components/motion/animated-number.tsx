"use client";

import { motion, useSpring, useTransform, useReducedMotion } from "motion/react";
import { useEffect } from "react";

export function AnimatedNumber({
  value,
  format = (n) => Math.round(n).toLocaleString("en-IN"),
}: {
  value: number;
  format?: (n: number) => string;
}) {
  const reduce = useReducedMotion();
  const spring = useSpring(reduce ? value : 0, { stiffness: 80, damping: 20 });
  const display = useTransform(spring, (v) => format(v));

  useEffect(() => {
    spring.set(value);
  }, [spring, value]);

  if (reduce) return <span>{format(value)}</span>;
  return <motion.span>{display}</motion.span>;
}

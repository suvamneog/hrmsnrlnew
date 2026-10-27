"use client";

import { InView as MotionPrimitivesInView } from "@/components/motion-primitives/in-view";
import { reveal } from "@/lib/motion";
import { useReducedMotion, type Transition, type UseInViewOptions, type Variant } from "motion/react";
import type { ReactNode } from "react";

export type InViewProps = {
  children: ReactNode;
  variants?: { hidden: Variant; visible: Variant };
  transition?: Transition;
  viewOptions?: UseInViewOptions;
  as?: React.ElementType;
  once?: boolean;
  className?: string;
  delay?: number;
};

// Blur, rise and fade together: the reveal used across the app.
export const blurSlide = {
  hidden: { opacity: 0, y: 14, filter: "blur(6px)" },
  visible: { opacity: 1, y: 0, filter: "blur(0px)" },
};

/* motion-primitives InView with the app's default reveal, a delay, and reduced-motion respected. */
export function InView({
  children,
  variants = blurSlide,
  transition,
  viewOptions,
  as = "div",
  once = true,
  className,
  delay = 0,
}: InViewProps) {
  const reduce = useReducedMotion();
  if (reduce) return <div className={className}>{children}</div>;
  return (
    <MotionPrimitivesInView
      as={as}
      once={once}
      className={className}
      variants={variants}
      transition={transition ?? { ...reveal, delay }}
      viewOptions={{ once, margin: "0px 0px -8% 0px", ...viewOptions }}
    >
      {children}
    </MotionPrimitivesInView>
  );
}

"use client";

import {
  motion,
  useReducedMotion,
  type Transition,
  type UseInViewOptions,
  type Variant,
} from "motion/react";
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

export const blurSlide = {
  hidden: { y: 16 },
  visible: { y: 0 },
};

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
  const MotionComponent = motion[as as "div"];

  if (reduce) {
    return <div className={className}>{children}</div>;
  }

  return (
    <MotionComponent
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{
        once,
        amount: viewOptions?.amount ?? 0.15,
        margin: viewOptions?.margin ?? "0px 0px -40px 0px",
      }}
      variants={variants}
      transition={
        transition ?? {
          duration: 0.5,
          delay,
          ease: [0.16, 1, 0.3, 1],
        }
      }
    >
      {children}
    </MotionComponent>
  );
}

export function Stagger({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reduce ? false : "hidden"}
      whileInView="visible"
      viewport={{ once: true, amount: 0.15 }}
      variants={{
        hidden: {},
        visible: { transition: { staggerChildren: 0.08 } },
      }}
    >
      {children}
    </motion.div>
  );
}

export function Item({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      className={className}
      variants={{
        hidden: { y: 12 },
        visible: {
          y: 0,
          transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] },
        },
      }}
    >
      {children}
    </motion.div>
  );
}

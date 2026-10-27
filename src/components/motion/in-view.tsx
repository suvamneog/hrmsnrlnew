"use client";

import {
  motion,
  useInView,
  useReducedMotion,
  type Transition,
  type UseInViewOptions,
  type Variant,
} from "motion/react";
import { type ReactNode, useRef, useState } from "react";

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

const defaultVariants = {
  hidden: { opacity: 0, y: 18, filter: "blur(6px)" },
  visible: { opacity: 1, y: 0, filter: "blur(0px)" },
};

export function InView({
  children,
  variants = defaultVariants,
  transition,
  viewOptions,
  as = "div",
  once = true,
  className,
  delay = 0,
}: InViewProps) {
  const ref = useRef(null);
  const isInView = useInView(ref, viewOptions ?? { amount: 0.2 });
  const [isViewed, setIsViewed] = useState(false);
  const reduce = useReducedMotion();
  const MotionComponent = motion.create(as as "div");

  if (reduce) {
    return <div className={className}>{children}</div>;
  }

  return (
    <MotionComponent
      ref={ref}
      className={className}
      initial="hidden"
      onAnimationComplete={() => {
        if (once) setIsViewed(true);
      }}
      animate={isInView || isViewed ? "visible" : "hidden"}
      variants={variants}
      transition={
        transition ?? {
          duration: 0.55,
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
      animate="visible"
      variants={{
        hidden: {},
        visible: { transition: { staggerChildren: 0.06 } },
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
        hidden: { opacity: 0, y: 14 },
        visible: {
          opacity: 1,
          y: 0,
          transition: { duration: 0.45, ease: [0.16, 1, 0.3, 1] },
        },
      }}
    >
      {children}
    </motion.div>
  );
}

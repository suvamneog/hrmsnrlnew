import type { Transition } from "motion/react";

/* One motion language for the whole app: soft springs for things that move, a long ease-out for things that appear. */
export const spring: Transition = { type: "spring", stiffness: 380, damping: 34, mass: 0.9 };
export const springSoft: Transition = { type: "spring", stiffness: 220, damping: 28 };
export const press: Transition = { type: "spring", stiffness: 520, damping: 30 };
export const easeOut = [0.22, 1, 0.36, 1] as const;
export const reveal: Transition = { duration: 0.6, ease: easeOut };

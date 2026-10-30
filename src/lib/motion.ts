import type { Transition } from "motion/react";

/* One motion language for the whole app, after Apple's fluid-interface springs and Emil Kowalski's timings.
   Springs are critically damped (bounce 0) so nothing overshoots unless a gesture threw it; "response" is
   Apple's settle time. Things that appear use a strong ease-out, never ease-in, and stay under 300ms. */
export const spring: Transition = { type: "spring", bounce: 0, duration: 0.4 };
export const springSoft: Transition = { type: "spring", bounce: 0, duration: 0.5 };
// Drawers and sheets: Apple ships damping 0.8, response 0.3; the small bounce only shows after a flick.
export const springDrawer: Transition = { type: "spring", bounce: 0.15, duration: 0.35 };
export const press: Transition = { type: "spring", bounce: 0, duration: 0.15 };
export const easeOut = [0.23, 1, 0.32, 1] as const;
export const easeDrawer = [0.32, 0.72, 0, 1] as const;
export const reveal: Transition = { duration: 0.5, ease: easeOut };

"use client";

import type { ReactNode } from "react";
import { InView } from "./in-view";

export type PresetType = string;

/* A group of blocks that fades in together. `preset` is kept for callers. */
export function AnimatedGroup({ children, className }: { children: ReactNode; className?: string; preset?: PresetType }) {
  return <InView className={className}>{children}</InView>;
}

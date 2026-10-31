"use client";

import { NavIcon } from "@/components/icons";
import { cn } from "@/lib/cn";
import { spring } from "@/lib/motion";
import type { NavItem } from "@/lib/nav";
import { motion, useReducedMotion } from "motion/react";
import Link from "next/link";

/* Phone tab bar in the style of iOS: a floating capsule of frosted glass over the page,
   with a lighter pill that springs to the tab you are on. Hidden from lg up, where the sidebar takes over. */
export function GlassTabBar({ items, path }: { items: NavItem[]; path: string }) {
  const reduce = useReducedMotion();
  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-3 bottom-[max(12px,env(safe-area-inset-bottom))] z-30 mx-auto flex max-w-md justify-between rounded-full bg-white/55 p-1.5 shadow-[0_10px_24px_rgba(20,26,58,0.14),inset_0_1px_0_rgba(255,255,255,0.85)] ring-1 ring-black/[0.06] backdrop-blur-2xl backdrop-saturate-150 lg:hidden"
    >
      {items.map((item) => {
        const active = path === item.href || path.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className="relative flex-1"
          >
            <motion.span
              whileTap={reduce ? undefined : { scale: 0.92 }}
              transition={spring}
              className={cn(
                "relative grid place-items-center gap-0.5 rounded-full py-1.5 text-[11px] font-medium transition-colors",
                active ? "text-brand" : "text-[#3c3c43]/70",
              )}
            >
              {active && (
                <motion.span
                  layoutId="glass-tab"
                  transition={reduce ? { duration: 0 } : spring}
                  className="absolute inset-0 rounded-full bg-white/85 shadow-[0_2px_10px_rgba(20,26,58,0.10),inset_0_1px_0_rgba(255,255,255,1)]"
                />
              )}
              <span className="relative">
                <NavIcon name={item.icon} size={22} />
              </span>
              <span className="relative">{item.label}</span>
            </motion.span>
          </Link>
        );
      })}
    </nav>
  );
}

"use client";

import { AnimatedNumber } from "@/components/motion/animated-number";
import { AnimatedGroup } from "@/components/motion/animated-group";
import { InView } from "@/components/motion/in-view";
import { cn } from "@/lib/cn";
import { easeOut } from "@/lib/motion";
import { AnimatePresence, motion } from "motion/react";
import type { ReactNode } from "react";

/* Shared layout for the role desks. One containment layer per block, a 20px grid gap,
   sentence-case labels and no announcing eyebrows above headings. */

export function Panel({
  title,
  note,
  action,
  className,
  children,
}: {
  title: string;
  note?: ReactNode;
  action?: ReactNode;
  className?: string;
  children: ReactNode;
}) {
  return (
    <InView className={cn("min-w-0", className)}>
      <section className="h-full rounded-[20px] border border-line bg-white p-5 sm:p-6">
        <header className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-[16px] font-semibold tracking-tight text-ink">{title}</h2>
            {note && <p className="mt-1 max-w-[60ch] text-[13px] leading-relaxed text-muted">{note}</p>}
          </div>
          {action}
        </header>
        {children}
      </section>
    </InView>
  );
}

export type Stat = { label: string; value: number | string; hint?: string; tone?: "ink" | "ok" | "warn" | "danger"; format?: (n: number) => string };

const TONE = { ink: "text-ink", ok: "text-[#0f9f6e]", warn: "text-[#c47b00]", danger: "text-[#d13b3b]" };

/* Big numbers first. Each tile is flat; hairlines split them instead of nested cards. */
export function Stats({ items }: { items: Stat[] }) {
  return (
    <AnimatedGroup
      preset="slide"
      className="grid grid-cols-2 overflow-hidden rounded-[20px] border border-line bg-white lg:grid-cols-4"
    >
      {items.map((s, i) => (
        <div
          key={s.label}
          className={cn(
            "min-w-0 p-5 sm:p-6",
            i % 2 === 1 && "border-l border-line",
            i >= 2 && "border-t border-line lg:border-t-0",
            i % 4 !== 0 && "lg:border-l",
          )}
        >
          <p className="text-[13px] text-muted">{s.label}</p>
          <p className={cn("mt-2 text-[30px] font-semibold leading-none tracking-[-0.03em] tabular-nums", TONE[s.tone ?? "ink"])}>
            {typeof s.value === "number" ? <AnimatedNumber value={s.value} format={s.format} /> : s.value}
          </p>
          {s.hint && <p className="mt-2 text-[12px] text-muted">{s.hint}</p>}
        </div>
      ))}
    </AnimatedGroup>
  );
}

/* A list whose rows slide in and out as records change state. */
export function Rows<T extends { id: string }>({
  items,
  render,
  empty,
}: {
  items: T[];
  render: (item: T) => ReactNode;
  empty: string;
}) {
  if (items.length === 0) return <p className="py-8 text-center text-sm text-muted">{empty}</p>;
  return (
    <ul className="-mx-2 divide-y divide-line">
      <AnimatePresence initial={false}>
        {items.map((item) => (
          <motion.li
            key={item.id}
            layout="position"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35, ease: easeOut }}
            className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 rounded-xl px-2 py-3.5 transition-colors hover:bg-[#f7f7f5]"
          >
            {render(item)}
          </motion.li>
        ))}
      </AnimatePresence>
    </ul>
  );
}

export function Field({ label, children, className }: { label: string; children: ReactNode; className?: string }) {
  return (
    <label className={cn("grid min-w-0 gap-1.5", className)}>
      <span className="text-[13px] font-medium text-ink/80">{label}</span>
      {children}
    </label>
  );
}

export function Pill({ tone = "muted", children }: { tone?: "ok" | "warn" | "danger" | "muted" | "brand"; children: ReactNode }) {
  const map = {
    ok: "bg-[#e7f8ef] text-[#0b7f58]",
    warn: "bg-[#fff4e0] text-[#9a5f00]",
    danger: "bg-[#fdecec] text-[#b42f2f]",
    muted: "bg-[#eef1f6] text-[#5b6478]",
    brand: "bg-brand-soft text-brand",
  };
  return <span className={cn("inline-flex shrink-0 items-center rounded-full px-2.5 py-1 text-[12px] font-medium", map[tone])}>{children}</span>;
}

export const Grid2 = ({ children, className }: { children: ReactNode; className?: string }) => (
  <div className={cn("grid items-start gap-5 *:min-w-0 xl:grid-cols-2", className)}>{children}</div>
);

/* Opens and closes by height so rows below glide instead of jumping. */
export function Collapse({ open, children }: { open: boolean; children: ReactNode }) {
  return (
    <AnimatePresence initial={false}>
      {open && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.4, ease: easeOut }}
          className="overflow-hidden"
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

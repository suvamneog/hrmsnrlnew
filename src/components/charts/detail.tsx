"use client";

import { cn } from "@/lib/cn";
import { easeOut, spring, springDrawer } from "@/lib/motion";
import { CaretLeft, CaretRight, X } from "@phosphor-icons/react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Dialog as D } from "radix-ui";
import { createContext, useContext, useId, useState } from "react";

export type DetailPart = { key: string; label: string; color: string; value: number };
export type DetailRow = { label: string; parts: DetailPart[] };

// ChartCard shares its title so the sheet can say which chart it came from.
export const ChartTitle = createContext("");

const ord = (n: number) => `${n}${["th", "st", "nd", "rd"][n % 100 > 10 && n % 100 < 14 ? 0 : n % 10 < 4 ? n % 10 : 0]}`;
const sum = (r: DetailRow) => r.parts.reduce((n, p) => n + p.value, 0);

/* The sheet that opens when any bar, point or slice is clicked: what the part is made of,
   and how it compares with the rest of the chart. Springs in from below, Apple style. */
export function ChartDetail({
  rows,
  index,
  onIndex,
  format,
}: {
  rows: DetailRow[];
  index: number | null;
  onIndex: (i: number | null) => void;
  format: (n: number) => string;
}) {
  const title = useContext(ChartTitle);
  const reduce = useReducedMotion();
  const [tab, setTab] = useState<"parts" | "compare">("parts");
  const pill = useId();
  const open = index !== null && !!rows[index];
  const row = open ? rows[index] : null;
  const total = row ? sum(row) : 0;
  const totals = rows.map(sum);
  const ranked = [...totals].sort((a, b) => b - a);
  const avg = totals.reduce((n, v) => n + v, 0) / Math.max(1, totals.length);
  const max = Math.max(1, ...totals);
  const prev = index !== null && index > 0 ? totals[index - 1] : null;
  const delta = (a: number, b: number) => (b ? `${a >= b ? "+" : "−"}${Math.abs(Math.round(((a - b) / b) * 100))}%` : "new");

  return (
    <D.Root open={open} onOpenChange={(o) => !o && onIndex(null)}>
      <AnimatePresence>
        {open && row && (
          <D.Portal forceMount>
            <D.Overlay asChild forceMount>
              <motion.div
                className="fixed inset-0 z-[70] bg-[#141a3a]/30 backdrop-blur-[6px]"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2, ease: easeOut }}
              />
            </D.Overlay>
            <D.Content
              forceMount
              aria-describedby={undefined}
              onClick={(e) => e.target === e.currentTarget && onIndex(null)}
              className="fixed inset-0 z-[71] flex items-end justify-center outline-none sm:items-center sm:p-6"
            >
              <motion.div
                className="flex max-h-[88dvh] w-full max-w-[520px] flex-col overflow-hidden rounded-t-[22px] bg-white/95 shadow-[0_24px_64px_rgba(20,26,58,0.18)] ring-1 ring-black/5 backdrop-blur-xl sm:rounded-[22px]"
                initial={reduce ? { opacity: 0 } : { opacity: 0, y: 40, scale: 0.97 }}
                animate={reduce ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
                exit={reduce ? { opacity: 0 } : { opacity: 0, y: 24, scale: 0.98, transition: { duration: 0.18, ease: easeOut } }}
                transition={springDrawer}
                drag={reduce ? false : "y"}
                dragConstraints={{ top: 0, bottom: 0 }}
                dragElastic={{ top: 0.05, bottom: 0.5 }}
                onDragEnd={(_, i) => (i.offset.y > 90 || i.velocity.y > 500) && onIndex(null)}
              >
                <span className="mx-auto mt-2.5 h-1 w-9 shrink-0 rounded-full bg-[#d2d2d7] sm:hidden" />
                <div className="flex items-start justify-between gap-3 px-6 pt-4 sm:pt-6">
                  <div className="min-w-0">
                    <p className="truncate text-[12px] text-muted">{title}</p>
                    <AnimatePresence mode="popLayout" initial={false}>
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 6, filter: "blur(2px)" }}
                        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                        exit={{ opacity: 0, y: -6, filter: "blur(2px)" }}
                        transition={{ duration: 0.2, ease: easeOut }}
                      >
                        <D.Title className="mt-1 text-[22px] font-semibold tracking-[-0.02em] text-ink">{row.label}</D.Title>
                        <p className="mt-1 text-[34px] font-semibold leading-none tracking-[-0.03em] tabular-nums text-ink">{format(total)}</p>
                      </motion.div>
                    </AnimatePresence>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <Round label="Previous" disabled={index === 0} onClick={() => onIndex(index! - 1)}>
                      <CaretLeft size={15} weight="bold" />
                    </Round>
                    <Round label="Next" disabled={index === rows.length - 1} onClick={() => onIndex(index! + 1)}>
                      <CaretRight size={15} weight="bold" />
                    </Round>
                    <D.Close asChild>
                      <Round label="Close">
                        <X size={15} weight="bold" />
                      </Round>
                    </D.Close>
                  </div>
                </div>

                <div className="px-6 pt-5">
                  <div role="tablist" className="inline-flex rounded-full bg-fill p-1">
                    {(
                      [
                        ["parts", "Breakdown"],
                        ["compare", "Compared"],
                      ] as const
                    ).map(([id, label]) => (
                      <button
                        key={id}
                        role="tab"
                        type="button"
                        aria-selected={tab === id}
                        onClick={() => setTab(id)}
                        className={cn("relative rounded-full px-4 py-1.5 text-[13px] font-semibold", tab === id ? "text-ink" : "text-muted hover:text-ink")}
                      >
                        {tab === id && <motion.span layoutId={pill} transition={spring} className="absolute inset-0 rounded-full bg-white shadow-[0_1px_3px_rgba(0,0,0,0.08)]" />}
                        <span className="relative">{label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="min-h-0 flex-1 overflow-y-auto px-6 pt-4 pb-[max(24px,env(safe-area-inset-bottom))]">
                  <AnimatePresence mode="wait" initial={false}>
                    <motion.div
                      key={`${tab}-${index}`}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      transition={{ duration: 0.18, ease: easeOut }}
                    >
                      {tab === "parts" ? (
                        <ul className="divide-y divide-fill">
                          {row.parts.map((p, i) => {
                            const share = total ? (p.value / total) * 100 : 0;
                            return (
                              <li key={p.key} className="py-3">
                                <div className="flex items-center justify-between gap-3 text-[14px]">
                                  <span className="inline-flex items-center gap-2 text-ink">
                                    <span className="h-2.5 w-2.5 rounded-[3px]" style={{ background: p.color }} />
                                    {p.label}
                                  </span>
                                  <span className="tabular-nums">
                                    <span className="font-semibold text-ink">{format(p.value)}</span>
                                    {row.parts.length > 1 && <span className="ml-2 text-muted">{Math.round(share)}%</span>}
                                  </span>
                                </div>
                                {row.parts.length > 1 && (
                                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-fill">
                                    <motion.div
                                      className="h-full rounded-full"
                                      style={{ background: p.color }}
                                      initial={{ width: 0 }}
                                      animate={{ width: `${share}%` }}
                                      transition={{ duration: 0.5, ease: easeOut, delay: i * 0.04 }}
                                    />
                                  </div>
                                )}
                              </li>
                            );
                          })}
                          <Fact label="Share of the whole chart" value={`${Math.round((total / Math.max(1, totals.reduce((n, v) => n + v, 0))) * 100)}%`} />
                        </ul>
                      ) : (
                        <div>
                          <ul className="divide-y divide-fill">
                            <Fact label="Rank" value={`${ord(ranked.indexOf(total) + 1)} of ${rows.length}`} />
                            <Fact label="Against the average" value={`${delta(total, avg)} (avg ${format(Math.round(avg))})`} />
                            {prev !== null && <Fact label={`Against ${rows[index! - 1].label}`} value={delta(total, prev)} />}
                          </ul>
                          <p className="mt-5 mb-2 text-[12px] text-muted">Every part of this chart. Tap one to open it.</p>
                          <ul className="space-y-1">
                            {rows.map((r, i) => (
                              <li key={r.label}>
                                <button
                                  type="button"
                                  onClick={() => onIndex(i)}
                                  className={cn("flex w-full items-center gap-3 rounded-lg px-2 py-1.5 text-left text-[13px]", i === index ? "bg-brand-soft" : "hover:bg-subtle")}
                                >
                                  <span className={cn("w-24 shrink-0 truncate", i === index ? "font-semibold text-ink" : "text-muted")}>{r.label}</span>
                                  <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-fill">
                                    <motion.span
                                      className="block h-full rounded-full"
                                      style={{ background: i === index ? "#3d5afe" : "#c7c7cc" }}
                                      initial={{ width: 0 }}
                                      animate={{ width: `${(totals[i] / max) * 100}%` }}
                                      transition={{ duration: 0.5, ease: easeOut, delay: i * 0.015 }}
                                    />
                                  </span>
                                  <span className="w-20 shrink-0 text-right tabular-nums text-ink">{format(totals[i])}</span>
                                </button>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </motion.div>
                  </AnimatePresence>
                </div>
              </motion.div>
            </D.Content>
          </D.Portal>
        )}
      </AnimatePresence>
    </D.Root>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <li className="flex items-center justify-between gap-3 py-3 text-[14px]">
      <span className="text-muted">{label}</span>
      <span className="font-semibold tabular-nums text-ink">{value}</span>
    </li>
  );
}

function Round({ label, children, ...props }: React.ComponentProps<"button"> & { label: string }) {
  return (
    <button type="button" aria-label={label} className="grid h-8 w-8 place-items-center rounded-full bg-fill text-ink hover:bg-[#e8e8ed] disabled:opacity-30" {...props}>
      {children}
    </button>
  );
}

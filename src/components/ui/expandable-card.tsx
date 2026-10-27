"use client";

import { Avatar } from "@/components/ui/avatar";
import { cn } from "@/lib/cn";
import { easeOut, spring } from "@/lib/motion";
import { CaretDown, Check, Flag, Hourglass } from "@phosphor-icons/react";
import { AnimatePresence, LayoutGroup, motion, useReducedMotion } from "motion/react";
import { useId, useState, type ReactNode } from "react";

export type ChecklistItem = { label: string; done: boolean; hint?: string; onToggle?: () => void };
export type Pill = { label: string; tone: "danger" | "warn" | "ok" | "muted" | "brand" };

const PILL: Record<Pill["tone"], string> = {
  danger: "bg-[#fdecec] text-[#c43d3d]",
  warn: "bg-[#fff4dc] text-[#a86a00]",
  ok: "bg-[#e7f8ef] text-[#0f8a5f]",
  muted: "bg-[#eef1f6] text-muted",
  brand: "bg-brand-soft text-brand",
};


/*
 * A compact row that grows in place into a checklist, like a task card.
 * Closed: icon, title, progress and avatars. Open: the steps on a tree line, priority, status and people.
 */
export function ExpandableCard({
  icon,
  title,
  subtitle,
  items,
  priority,
  status,
  people = [],
  footer,
  defaultOpen = false,
}: {
  icon: ReactNode;
  title: string;
  subtitle?: string;
  items: ChecklistItem[];
  priority?: Pill;
  status?: Pill;
  people?: string[];
  footer?: ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const reduce = useReducedMotion();
  const id = useId();
  const done = items.filter((i) => i.done).length;
  const pct = items.length ? Math.round((done / items.length) * 100) : 0;
  const t = reduce ? { duration: 0 } : spring;

  return (
    <LayoutGroup id={id}>
      <motion.div
        layout
        transition={t}
        style={{ borderRadius: 22 }}
        className={cn(
          "overflow-hidden bg-white ring-1 ring-[#e7eaf3] transition-shadow",
          open ? "shadow-[0_24px_60px_rgba(27,33,64,0.12)]" : "shadow-[0_6px_20px_rgba(27,33,64,0.06)] hover:shadow-[0_12px_32px_rgba(27,33,64,0.1)]",
        )}
      >
        <motion.button
          layout="position"
          transition={t}
          type="button"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className="block w-full p-4 text-left sm:p-5"
        >
          <div className="flex items-center gap-3">
            <motion.span
              layout
              transition={t}
              className={cn(
                "grid shrink-0 place-items-center rounded-2xl bg-[#f3f5fb] text-ink ring-1 ring-[#e7eaf3]",
                open ? "h-12 w-12" : "h-10 w-10",
              )}
            >
              {icon}
            </motion.span>
            <motion.div layout="position" transition={t} className="min-w-0 flex-1">
              <p className={cn("truncate font-semibold tracking-tight", open ? "text-[19px]" : "text-[15px]")}>{title}</p>
              {subtitle && <p className="truncate text-[12px] text-muted">{subtitle}</p>}
            </motion.div>
            {!open && (
              <motion.div layoutId="progress" transition={t} className="hidden items-center gap-2.5 sm:flex">
                <Progress pct={pct} className="w-28" />
                <span className="w-9 text-right text-[13px] tabular-nums text-muted">{pct}%</span>
              </motion.div>
            )}
            <motion.span animate={{ rotate: open ? 180 : 0 }} transition={t} className="text-muted">
              <CaretDown size={16} weight="bold" />
            </motion.span>
          </div>

          {!open && (
            <motion.div layout="position" transition={t} className="mt-3 flex items-center gap-4 text-[13px] text-muted">
              {priority && (
                <span className="inline-flex items-center gap-1.5">
                  <Flag size={14} weight="fill" className="text-[#b8c0d0]" />
                  {priority.label}
                </span>
              )}
              {status && (
                <span className="inline-flex items-center gap-1.5">
                  <Hourglass size={14} weight="fill" className="text-[#b8c0d0]" />
                  {status.label}
                </span>
              )}
              <span className="ml-auto flex -space-x-2">
                {people.slice(0, 3).map((n) => (
                  <motion.span key={n} layoutId={`p-${n}`} transition={t}>
                    <Avatar name={n} size={28} className="ring-2 ring-white" />
                  </motion.span>
                ))}
              </span>
            </motion.div>
          )}
        </motion.button>

        <AnimatePresence initial={false}>
          {open && (
            <motion.div
              key="body"
              initial={{ opacity: 0, y: -6, filter: "blur(4px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: -6, filter: "blur(4px)", transition: { duration: 0.15 } }}
              transition={reduce ? { duration: 0 } : { duration: 0.32, ease: easeOut, delay: 0.05 }}
              className="px-4 pb-5 sm:px-5"
            >
              <motion.div
                layoutId="progress"
                transition={t}
                className="inline-flex items-center gap-2.5 rounded-full bg-white px-3 py-1.5 text-[13px] ring-1 ring-[#e7eaf3]"
              >
                <span className="grid h-4 w-4 place-items-center rounded-full ring-1 ring-[#c3c9d6]">
                  <Check size={9} weight="bold" className="text-muted" />
                </span>
                <span className="tabular-nums text-muted">
                  {done} of {items.length}
                </span>
                <Progress pct={pct} className="w-28" />
                <span className="tabular-nums text-muted">{pct}%</span>
              </motion.div>

              <ul className="relative ml-[22px] mt-1 border-l border-[#dfe3ec] pt-1">
                {items.map((it, i) => (
                  <motion.li
                    key={it.label}
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={reduce ? { duration: 0 } : { delay: 0.08 + i * 0.04, duration: 0.28 }}
                    className="relative flex items-center gap-3 py-2 pl-6"
                  >
                    <span className="absolute left-0 top-1/2 h-px w-4 bg-[#dfe3ec]" />
                    <button
                      type="button"
                      disabled={!it.onToggle || it.done}
                      onClick={it.onToggle}
                      className={cn(
                        "grid h-5 w-5 shrink-0 place-items-center rounded-full transition",
                        it.done ? "bg-ink text-white" : "ring-[1.5px] ring-[#b8c0d0]",
                        it.onToggle && !it.done && "hover:ring-brand",
                      )}
                      aria-label={it.done ? `${it.label} done` : `Mark ${it.label} done`}
                    >
                      {it.done && <Check size={11} weight="bold" />}
                    </button>
                    <span className={cn("text-[14px]", it.done ? "text-ink" : "text-muted")}>{it.label}</span>
                    {it.hint && <span className="ml-auto text-[11px] text-muted">{it.hint}</span>}
                  </motion.li>
                ))}
              </ul>

              {(priority || status) && (
                <div className="mt-4 grid grid-cols-[96px_1fr] items-center gap-y-3 text-[14px]">
                  {priority && (
                    <>
                      <span className="inline-flex items-center gap-2 text-muted">
                        <Flag size={15} weight="fill" className="text-[#b8c0d0]" /> Priority
                      </span>
                      <span className={cn("justify-self-start rounded-lg px-2.5 py-1 text-[13px] font-medium", PILL[priority.tone])}>{priority.label}</span>
                    </>
                  )}
                  {status && (
                    <>
                      <span className="inline-flex items-center gap-2 text-muted">
                        <Hourglass size={15} weight="fill" className="text-[#b8c0d0]" /> Status
                      </span>
                      <span className={cn("justify-self-start rounded-lg px-2.5 py-1 text-[13px] font-medium", PILL[status.tone])}>{status.label}</span>
                    </>
                  )}
                </div>
              )}

              {people.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {people.map((n) => (
                    <motion.span
                      key={n}
                      layoutId={`p-${n}`}
                      transition={t}
                      className="inline-flex items-center gap-2 rounded-full bg-white py-1 pl-1 pr-3 text-[13px] font-medium ring-1 ring-[#e7eaf3]"
                    >
                      <Avatar name={n} size={24} />
                      {n.split(" ")[0]}
                    </motion.span>
                  ))}
                </div>
              )}
              {footer && <div className="mt-4">{footer}</div>}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </LayoutGroup>
  );
}

function Progress({ pct, className }: { pct: number; className?: string }) {
  return (
    <span className={cn("block h-1.5 overflow-hidden rounded-full bg-[#e9ecf2]", className)}>
      <motion.span
        className="block h-full rounded-full bg-[#34c759]"
        initial={{ width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 0.7, ease: easeOut }}
      />
    </span>
  );
}

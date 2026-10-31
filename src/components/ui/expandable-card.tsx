"use client";

import { Avatar } from "@/components/ui/avatar";
import { cn } from "@/lib/cn";
import { easeOut, spring } from "@/lib/motion";
import { CaretDown, Check, Flag, Hourglass } from "@phosphor-icons/react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useState, type ReactNode } from "react";

export type ChecklistItem = { label: string; done: boolean; hint?: string; onToggle?: () => void };
export type Pill = { label: string; tone: "danger" | "warn" | "ok" | "muted" | "brand" };

const PILL: Record<Pill["tone"], string> = {
  danger: "bg-danger-soft text-danger",
  warn: "bg-warn-soft text-warn",
  ok: "bg-ok-soft text-[#0f8a5f]",
  muted: "bg-fill text-muted",
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
  const done = items.filter((i) => i.done).length;
  const pct = items.length ? Math.round((done / items.length) * 100) : 0;
  const t = reduce ? { duration: 0 } : spring;

  return (
          <div
        style={{ borderRadius: 22 }}
        className={cn(
          "overflow-hidden bg-white ring-1 ring-line transition-shadow duration-500",
          open ? "" : " ",
        )}
      >
        <button
          type="button"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className="block w-full p-4 text-left sm:p-5"
        >
          <div className="flex items-center gap-3">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-subtle text-ink ring-1 ring-line">
              {icon}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[15px] font-semibold tracking-tight">{title}</p>
              {subtitle && <p className="truncate text-[12px] text-muted">{subtitle}</p>}
            </div>
            <motion.div
              animate={{ opacity: open ? 0 : 1, x: open ? 8 : 0 }}
              transition={{ duration: 0.25, ease: easeOut }}
              className="hidden items-center gap-2.5 sm:flex"
              aria-hidden={open}
            >
              <Progress pct={pct} className="w-28" />
              <span className="w-9 text-right text-[13px] tabular-nums text-muted">{pct}%</span>
            </motion.div>
            <motion.span animate={{ rotate: open ? 180 : 0 }} transition={t} className="text-muted">
              <CaretDown size={16} weight="bold" />
            </motion.span>
          </div>

          <AnimatePresence initial={false}>
          {!open && (
            <Collapse key="summary" reduce={!!reduce}>
            <div className="flex items-center gap-4 pt-3 text-[13px] text-muted">
              {priority && (
                <span className="inline-flex items-center gap-1.5">
                  <Flag size={14} weight="fill" className="text-faint" />
                  {priority.label}
                </span>
              )}
              {status && (
                <span className="inline-flex items-center gap-1.5">
                  <Hourglass size={14} weight="fill" className="text-faint" />
                  {status.label}
                </span>
              )}
              <span className="ml-auto flex -space-x-2">
                {people.slice(0, 3).map((n) => (
                  <Avatar key={n} name={n} size={28} className="ring-2 ring-white" />
                ))}
              </span>
            </div>
            </Collapse>
          )}
          </AnimatePresence>
        </button>

        <AnimatePresence initial={false}>
          {open && (
            <Collapse key="body" reduce={!!reduce}>
            <div className="px-4 pb-5 sm:px-5">
              <div
                className="inline-flex items-center gap-2.5 rounded-lg bg-white px-3 py-1.5 text-[13px] ring-1 ring-line"
              >
                <span className="grid h-4 w-4 place-items-center rounded-full ring-1 ring-faint">
                  <Check size={9} weight="bold" className="text-muted" />
                </span>
                <span className="tabular-nums text-muted">
                  {done} of {items.length}
                </span>
                <Progress pct={pct} className="w-28" />
                <span className="tabular-nums text-muted">{pct}%</span>
              </div>

              <ul className="relative ml-[22px] mt-1 border-l border-line pt-1">
                {items.map((it, i) => (
                  <motion.li
                    key={it.label}
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={reduce ? { duration: 0 } : { delay: 0.08 + i * 0.04, duration: 0.28 }}
                    className="relative flex items-center gap-3 py-2 pl-6"
                  >
                    <span className="absolute left-0 top-1/2 h-px w-4 bg-line" />
                    <button
                      type="button"
                      disabled={!it.onToggle || it.done}
                      onClick={it.onToggle}
                      className={cn(
                        "grid h-5 w-5 shrink-0 place-items-center rounded-full transition",
                        it.done ? "bg-ink text-white" : "ring-[1.5px] ring-faint",
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
                        <Flag size={15} weight="fill" className="text-faint" /> Priority
                      </span>
                      <span className={cn("justify-self-start rounded-lg px-2.5 py-1 text-[13px] font-medium", PILL[priority.tone])}>{priority.label}</span>
                    </>
                  )}
                  {status && (
                    <>
                      <span className="inline-flex items-center gap-2 text-muted">
                        <Hourglass size={15} weight="fill" className="text-faint" /> Status
                      </span>
                      <span className={cn("justify-self-start rounded-lg px-2.5 py-1 text-[13px] font-medium", PILL[status.tone])}>{status.label}</span>
                    </>
                  )}
                </div>
              )}

              {people.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {people.map((n) => (
                    <span
                      key={n}
                      className="inline-flex items-center gap-2 rounded-full bg-white py-1 pl-1 pr-3 text-[13px] font-medium ring-1 ring-line"
                    >
                      <Avatar name={n} size={24} />
                      {n.split(" ")[0]}
                    </span>
                  ))}
                </div>
              )}
              {footer && <div className="mt-4">{footer}</div>}
            </div>
            </Collapse>
          )}
        </AnimatePresence>
      </div>
  );
}

/*
 * Height from 0 to auto and back, so the card and everything below it glide.
 * Content fades a beat after the height starts, and leaves before it ends.
 */
function Collapse({ children, reduce }: { children: ReactNode; reduce: boolean }) {
  const glide = [0.32, 0.72, 0, 1] as const;
  return (
    <motion.div
      initial={{ height: 0, opacity: 0 }}
      animate={{
        height: "auto",
        opacity: 1,
        transition: reduce ? { duration: 0 } : { height: { duration: 0.5, ease: glide }, opacity: { duration: 0.3, delay: 0.08 } },
      }}
      exit={{
        height: 0,
        opacity: 0,
        transition: reduce ? { duration: 0 } : { height: { duration: 0.42, ease: glide }, opacity: { duration: 0.18 } },
      }}
      style={{ overflow: "hidden" }}
    >
      {children}
    </motion.div>
  );
}

function Progress({ pct, className }: { pct: number; className?: string }) {
  return (
    <span className={cn("block h-1.5 overflow-hidden rounded-full bg-[#e9ecf2]", className)}>
      <motion.span
        className="block h-full w-full origin-left rounded-full bg-[#34c759]"
        initial={{ scaleX: 0 }}
        animate={{ scaleX: pct / 100 }}
        transition={{ duration: 0.7, ease: easeOut }}
      />
    </span>
  );
}

"use client";

import { Avatar } from "@/components/ui/avatar";
import { cn } from "@/lib/cn";
import { DEMO_TODAY } from "@/lib/demo";
import { easeOut, spring } from "@/lib/motion";
import { positionTitle, unitName } from "@/lib/org";
import { SHIFT_STYLE, ShiftIcon } from "@/lib/shift-style";
import { useHrms } from "@/lib/store";
import type { Employee } from "@/lib/types";
import { ArrowDownRight, ArrowUpRight, CaretLeft, CaretRight, CheckCircle, Clock, MagnifyingGlass, MinusCircle } from "@phosphor-icons/react";
import { addDays, differenceInMinutes, format, parseISO } from "date-fns";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import Link from "next/link";
import { useMemo, useState } from "react";

type Status = "present" | "inside" | "late" | "missing" | "off" | "leave" | "upcoming";

const STATUS: Record<Status, { label: string; tone: string }> = {
  present: { label: "Present", tone: "bg-ok-soft text-ok" },
  inside: { label: "Inside now", tone: "bg-brand-soft text-brand" },
  late: { label: "Late", tone: "bg-warn-soft text-[#8a5600]" },
  missing: { label: "No check-in", tone: "bg-danger-soft text-danger" },
  off: { label: "Day off", tone: "bg-fill text-muted" },
  leave: { label: "On leave", tone: "bg-fill text-ink" },
  upcoming: { label: "Not started", tone: "bg-fill text-muted" },
};
// Late first, then no check-in, then everyone else in a calm order.
const RANK: Record<Status, number> = { late: 0, missing: 1, inside: 2, present: 3, upcoming: 4, leave: 5, off: 6 };
const FILTERS: { id: "all" | Status; label: string }[] = [
  { id: "all", label: "Everyone" },
  { id: "late", label: "Late" },
  { id: "missing", label: "No check-in" },
  { id: "present", label: "Present" },
  { id: "off", label: "Day off" },
];

const clock = (iso: string) => format(parseISO(iso), "h:mm a");
const hm = (min: number) => `${Math.floor(min / 60)}h ${String(min % 60).padStart(2, "0")}m`;

/* The crew's day at a glance, laid out like iOS: three stat cards against the day before, a strip of
   days, search and filter chips, then one row per person with their shift, check-in to check-out and status. */
export function DayBoard({ people, meId }: { people: Employee[]; meId: string }) {
  const reduce = useReducedMotion();
  const roster = useHrms((s) => s.roster);
  const shifts = useHrms((s) => s.shifts);
  const punches = useHrms((s) => s.punches);
  const leave = useHrms((s) => s.leaveRequests);
  const [day, setDay] = useState(DEMO_TODAY);
  const [start, setStart] = useState(() => format(addDays(parseISO(DEMO_TODAY), -2), "yyyy-MM-dd"));
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<"all" | Status>("all");
  const [sortLate, setSortLate] = useState(true);

  const rowsFor = useMemo(
    () => (date: string) =>
      people.map((e) => {
        const code = roster.find((r) => r.employeeId === e.id && r.date === date)?.shiftId ?? "OFF";
        const shift = shifts.find((s) => s.id === code);
        const mine = punches.filter((p) => p.employeeId === e.id).sort((a, b) => a.time.localeCompare(b.time));
        // The check-in on this date, and the first check-out after it (a night shift ends the next morning).
        const inn = mine.find((p) => p.kind === "in" && p.time.startsWith(date));
        const out = inn ? mine.find((p) => p.kind === "out" && p.time > inn.time && differenceInMinutes(parseISO(p.time), parseISO(inn.time)) < 16 * 60) : undefined;
        const onLeave = leave.some((l) => l.employeeId === e.id && l.status === "approved" && l.from <= date && l.to >= date);
        let late = 0;
        if (inn && shift?.start) {
          const due = parseISO(`${date}T${shift.start}:00+05:30`);
          late = Math.max(0, differenceInMinutes(parseISO(inn.time), due));
        }
        const status: Status =
          code === "OFF" ? "off"
          : onLeave ? "leave"
          : date > DEMO_TODAY ? "upcoming"
          : inn && late > 5 ? "late"
          : inn && !out && date === DEMO_TODAY ? "inside"
          : inn ? "present"
          : date === DEMO_TODAY && shift?.start && shift.start >= "14:00" ? "upcoming"
          : "missing";
        return { e, code, shift, inn, out, late, status };
      }),
    [people, roster, shifts, punches, leave],
  );

  const rows = rowsFor(day);
  const prev = rowsFor(format(addDays(parseISO(day), -1), "yyyy-MM-dd"));
  const count = (list: typeof rows, ...s: Status[]) => list.filter((r) => s.includes(r.status)).length;
  const stats = [
    { id: "present", label: day > DEMO_TODAY ? "Rostered to work" : "Present", value: day > DEMO_TODAY ? count(rows, "upcoming") : count(rows, "present", "inside", "late"), was: count(prev, "present", "inside", "late"), Icon: CheckCircle, card: "bg-[#e8edff]", chip: "bg-[#c9d4ff] text-brand", good: "up" },
    { id: "late", label: "Late", value: count(rows, "late"), was: count(prev, "late"), Icon: Clock, card: "bg-[#fff1d6]", chip: "bg-[#ffe1a1] text-[#8a5600]", good: "down" },
    { id: "missing", label: "No check-in", value: count(rows, "missing"), was: count(prev, "missing"), Icon: MinusCircle, card: "bg-[#ffe3e1]", chip: "bg-[#ffc8c3] text-danger", good: "down" },
  ] as const;

  const term = q.trim().toLowerCase();
  const shown = rows
    .filter((r) => filter === "all" || r.status === filter || (filter === "present" && r.status === "inside"))
    .filter((r) => !term || `${r.e.name} ${r.e.empNo} ${positionTitle(r.e.positionId)}`.toLowerCase().includes(term))
    .sort((a, b) => (sortLate ? RANK[a.status] - RANK[b.status] || b.late - a.late : 0) || a.e.name.localeCompare(b.e.name));
  const strip = Array.from({ length: 7 }, (_, i) => format(addDays(parseISO(start), i), "yyyy-MM-dd"));

  return (
    <section className="mb-6">
      {/* Three numbers for the chosen day, each against the day before. */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        {stats.map((s, i) => {
          const d = s.value - s.was;
          const better = d === 0 ? null : (d > 0) === (s.good === "up");
          return (
            <motion.div
              key={s.id}
              initial={reduce ? false : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, ease: easeOut, delay: i * 0.05 }}
              className={cn("rounded-[22px] p-3.5 sm:p-5", s.card)}
            >
              <div className="flex flex-col items-start gap-2 sm:flex-row sm:gap-3">
                <span className={cn("grid h-8 w-8 shrink-0 place-items-center rounded-full sm:h-10 sm:w-10", s.chip)}>
                  <s.Icon size={20} weight="duotone" />
                </span>
                <div className="min-w-0">
                  <AnimatePresence mode="popLayout" initial={false}>
                    <motion.p
                      key={`${day}-${s.value}`}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.25, ease: easeOut }}
                      className="text-[30px] font-semibold leading-none tracking-[-0.04em] tabular-nums text-ink sm:text-[40px]"
                    >
                      {s.value}
                    </motion.p>
                  </AnimatePresence>
                  <p className="mt-1.5 text-[13px] font-medium leading-tight text-ink/80 sm:text-[15px]">{s.label}</p>
                  <p className={cn("mt-1 inline-flex items-start gap-1 text-[11px] font-medium leading-tight sm:text-[12px]", better === null ? "text-muted" : better ? "text-ok" : "text-danger")}>
                    {d > 0 ? <ArrowUpRight size={13} weight="bold" /> : d < 0 ? <ArrowDownRight size={13} weight="bold" /> : null}
                    {d === 0 ? "Same as the day before" : `${d > 0 ? "+" : "−"}${Math.abs(d)} on the day before`}
                  </p>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* A week of days; the chosen one is a dark capsule that springs between them. */}
      <div className="mt-4 flex items-stretch gap-2">
        <button type="button" aria-label="Earlier days" onClick={() => setStart(format(addDays(parseISO(start), -7), "yyyy-MM-dd"))} className="grid w-10 shrink-0 place-items-center rounded-[18px] bg-white text-muted ring-1 ring-line hover:text-ink">
          <CaretLeft size={16} weight="bold" />
        </button>
        <div className="flex min-w-0 flex-1 gap-1.5 overflow-x-auto sm:gap-2" style={{ scrollbarWidth: "none" }}>
          {strip.map((d) => {
            const on = d === day;
            return (
              <button
                key={d}
                type="button"
                onClick={() => setDay(d)}
                aria-pressed={on}
                className="relative w-[68px] shrink-0 rounded-[18px] bg-white py-2.5 text-center ring-1 ring-line sm:w-auto sm:min-w-0 sm:flex-1"
              >
                {on && <motion.span layoutId="roster-day" transition={reduce ? { duration: 0 } : spring} className="absolute inset-0 rounded-[18px] bg-[#141a3a]" />}
                <span className={cn("relative block text-[22px] font-semibold leading-tight tabular-nums sm:text-[24px]", on ? "text-white" : "text-ink")}>{format(parseISO(d), "d")}</span>
                <span className={cn("relative block truncate px-1 text-[11px] sm:text-[12px]", on ? "text-white/80" : "text-muted")}>
                  {d === DEMO_TODAY ? "Today" : format(parseISO(d), "EEEE")}
                </span>
              </button>
            );
          })}
        </div>
        <button type="button" aria-label="Later days" onClick={() => setStart(format(addDays(parseISO(start), 7), "yyyy-MM-dd"))} className="grid w-10 shrink-0 place-items-center rounded-[18px] bg-white text-muted ring-1 ring-line hover:text-ink">
          <CaretRight size={16} weight="bold" />
        </button>
      </div>

      {/* Search, then filter chips with counts and the sort. */}
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <label className="flex h-10 min-w-0 flex-1 basis-56 items-center gap-2 rounded-full bg-white px-4 ring-1 ring-line focus-within:ring-brand">
          <MagnifyingGlass size={16} className="shrink-0 text-muted" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search employee" className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted" />
        </label>
        <div className="flex max-w-full gap-1.5 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
          {FILTERS.map((f) => {
            const n = f.id === "all" ? rows.length : f.id === "present" ? count(rows, "present", "inside") : count(rows, f.id);
            const on = filter === f.id;
            return (
              <button
                key={f.id}
                type="button"
                onClick={() => setFilter(f.id)}
                className={cn("shrink-0 whitespace-nowrap rounded-full px-3.5 py-2 text-[13px] font-medium ring-1 transition-colors", on ? "bg-ink text-white ring-ink" : "bg-white text-ink ring-line hover:bg-subtle")}
              >
                {f.label} <span className={cn("tabular-nums", on ? "text-white/70" : "text-muted")}>{n}</span>
              </button>
            );
          })}
          <button type="button" onClick={() => setSortLate(!sortLate)} className="shrink-0 whitespace-nowrap rounded-full bg-white px-3.5 py-2 text-[13px] font-medium text-ink ring-1 ring-line hover:bg-subtle">
            Sort: {sortLate ? "Late first" : "Name"}
          </button>
        </div>
      </div>

      {/* One row per person. Desktop reads as a table; on a phone each row stacks into a card. */}
      <div className="mt-4 overflow-hidden rounded-[22px] bg-white ring-1 ring-line">
        <div className="hidden grid-cols-[1.6fr_1.2fr_1.6fr_auto] gap-4 border-b border-line px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.06em] text-muted md:grid">
          <span>Employee</span>
          <span>Shift</span>
          <span>Check in and out</span>
          <span className="text-right">Status</span>
        </div>
        {/* A new day fades the whole list in; within a day, filtering and sorting glide rows into place. */}
        <AnimatePresence mode="wait" initial={false}>
        <motion.ul key={day} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15, ease: easeOut }}>
          <AnimatePresence initial={false}>
            {shown.map((r) => {
              const st = SHIFT_STYLE[r.code];
              const worked = r.inn && r.out ? differenceInMinutes(parseISO(r.out.time), parseISO(r.inn.time)) : null;
              const leftEarly = r.out && r.shift?.end && r.code !== "N" && format(parseISO(r.out.time), "HH:mm") < r.shift.end;
              return (
                <motion.li
                  key={r.e.id}
                  layout={!reduce}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2, ease: easeOut, layout: spring }}
                  className="grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-3 border-b border-line px-4 py-4 last:border-0 md:grid-cols-[1.6fr_1.2fr_1.6fr_auto] md:px-5"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <Avatar name={r.e.name} size={40} />
                    <div className="min-w-0">
                      <p className="truncate text-[15px] font-semibold text-ink">{r.e.name}</p>
                      <p className="truncate text-[12px] text-muted">
                        {positionTitle(r.e.positionId)} · {r.e.empNo}
                      </p>
                    </div>
                  </div>

                  <span className={cn("justify-self-end rounded-full px-3 py-1 text-[12px] font-semibold md:order-last", STATUS[r.status].tone)}>
                    {STATUS[r.status].label}
                    {r.status === "late" && ` ${r.late} min`}
                  </span>

                  <div className="col-span-2 flex min-w-0 items-center gap-2.5 md:col-span-1">
                    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-[10px]" style={{ background: st?.bg, color: st?.ink }}>
                      <ShiftIcon code={r.code} size={15} />
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-[14px] font-medium text-ink">{st?.name ?? r.code}</span>
                      <span className="block truncate text-[12px] text-muted">
                        {st?.hours || `Crew ${r.e.crew ?? "day"}`} · {unitName(r.e.unitId)}
                      </span>
                    </span>
                  </div>

                  <div className="col-span-2 flex min-w-0 items-center gap-2 text-[14px] tabular-nums md:col-span-1">
                    {r.inn ? (
                      <>
                        <span className={cn("shrink-0 font-medium", r.status === "late" ? "text-danger" : "text-ink")}>{clock(r.inn.time)}</span>
                        <span className="flex min-w-6 flex-1 items-center gap-1.5 text-[12px] text-muted">
                          <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#c7c7cc]" />
                          <span className="h-px flex-1 bg-[#d2d2d7]" />
                          <span className="shrink-0">{worked != null ? hm(worked) : "inside"}</span>
                          <span className="h-px flex-1 bg-[#d2d2d7]" />
                          <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#c7c7cc]" />
                        </span>
                        <span className={cn("shrink-0 font-medium", !r.out ? "text-muted" : leftEarly ? "text-[#c2410c]" : "text-ink")}>{r.out ? clock(r.out.time) : "—"}</span>
                      </>
                    ) : r.status === "missing" ? (
                      <span className="flex items-center gap-3 text-[13px] text-muted">
                        No check-in recorded
                        {r.e.id === meId && (
                          <Link href="/time" className="rounded-full bg-white px-3 py-1 text-[12px] font-semibold text-brand ring-1 ring-line hover:bg-subtle">
                            Correct
                          </Link>
                        )}
                      </span>
                    ) : (
                      <span className="text-[13px] text-muted">{r.status === "upcoming" && r.shift?.start ? `Starts ${format(parseISO(`${day}T${r.shift.start}:00`), "h:mm a")}` : "—"}</span>
                    )}
                  </div>
                </motion.li>
              );
            })}
          </AnimatePresence>
          {shown.length === 0 && <li className="px-5 py-10 text-center text-sm text-muted">Nobody matches. Clear the search or pick Everyone.</li>}
        </motion.ul>
        </AnimatePresence>
      </div>
    </section>
  );
}

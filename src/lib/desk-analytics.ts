import { addDays, format, parseISO } from "date-fns";
import { DEMO_TODAY, openPair, punchesOn } from "./demo";
import { insideNow } from "./gate";
import { settingOn } from "./payroll";
import { shiftFlags } from "./time-rules";
import type {
  AttendanceDay,
  Certificate,
  ContractWorker,
  Employee,
  GateEvent,
  GatePass,
  LeaveRequest,
  PayrollRun,
  PolicySetting,
  Punch,
  RosterEntry,
  ShiftPattern,
} from "./types";
import { unitName } from "./org";

const day = (iso: string) => format(parseISO(iso), "d MMM");

/* Overtime hours and cost per day, priced at the workmen hourly rate in force. */
export function overtimeByDay(attendance: AttendanceDay[], employees: Employee[], settings: PolicySetting[], days = 14, ids?: Set<string>) {
  const start = format(addDays(parseISO(DEMO_TODAY), -(days - 1)), "yyyy-MM-dd");
  const cadre = new Map(employees.map((e) => [e.id, e.cadre]));
  const rows = new Map<string, { day: string; hours: number; cost: number }>();
  for (const a of attendance) {
    if (a.date < start || a.date > DEMO_TODAY || !a.overtime) continue;
    if (ids && !ids.has(a.employeeId)) continue;
    const rate = settingOn(settings, "ot.hourly", a.date, cadre.get(a.employeeId) ?? "workman");
    const r = rows.get(a.date) ?? { day: day(a.date), hours: 0, cost: 0 };
    r.hours += a.overtime;
    r.cost += a.overtime * rate;
    rows.set(a.date, r);
  }
  return [...rows.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([, r]) => r);
}

export type ShiftCode = "M" | "A" | "N";
export const SHIFT_CHANGE: { code: ShiftCode; at: string; label: string }[] = [
  { code: "M", at: "06:00", label: "Morning" },
  { code: "A", at: "14:00", label: "Afternoon" },
  { code: "N", at: "22:00", label: "Night" },
];

/* One row per person rostered on a shift today, with what is wrong at the changeover. */
export function shiftExceptions(args: {
  people: Employee[];
  roster: RosterEntry[];
  shifts: ShiftPattern[];
  attendance: AttendanceDay[];
  punches: Punch[];
  leave: LeaveRequest[];
  date?: string;
}) {
  const date = args.date ?? DEMO_TODAY;
  const out: { id: string; employee: Employee; shift: ShiftCode; issue: "late" | "absent" | "leave" | "ok"; minutes?: number }[] = [];
  for (const e of args.people) {
    const r = args.roster.find((x) => x.employeeId === e.id && x.date === date);
    const shift = args.shifts.find((s) => s.id === r?.shiftId);
    if (!shift || !["M", "A", "N"].includes(shift.code)) continue;
    const onLeave = args.leave.some((l) => l.employeeId === e.id && l.status === "approved" && l.from <= date && l.to >= date);
    const a = args.attendance.find((x) => x.employeeId === e.id && x.date === date);
    const flags = shiftFlags({ punches: args.punches, date, shift, employeeId: e.id });
    const inside = openPair(punchesOn(args.punches, e.id, date)).inside;
    const issue = onLeave || a?.status === "leave"
      ? "leave"
      : flags.lateMinutes > 0
        ? "late"
        : a?.status === "present" || inside
          ? "ok"
          : "absent";
    out.push({ id: `${e.id}-${date}`, employee: e, shift: shift.code as ShiftCode, issue, minutes: flags.lateMinutes || undefined });
  }
  return out;
}

/* Shifts next week that drop below minimum manning if lapsing certificates take people off. */
export function lapseImpact(args: {
  people: Employee[];
  roster: RosterEntry[];
  certs: Certificate[];
  min: number;
  days?: number;
}) {
  const days = args.days ?? 7;
  const res: { id: string; date: string; day: string; shift: string; rostered: number; lapsed: string[]; after: number }[] = [];
  for (let i = 1; i <= days; i++) {
    const date = format(addDays(parseISO(DEMO_TODAY), i), "yyyy-MM-dd");
    for (const code of ["M", "A", "N"]) {
      const on = args.people.filter((e) => args.roster.some((r) => r.employeeId === e.id && r.date === date && r.shiftId === code));
      if (!on.length) continue;
      const lapsed = on.filter((e) => args.certs.some((c) => c.personId === e.id && c.expires < date));
      if (!lapsed.length) continue;
      const after = on.length - lapsed.length;
      res.push({ id: `${date}-${code}`, date, day: format(parseISO(date), "EEE d MMM"), shift: code, rostered: on.length, lapsed: lapsed.map((e) => e.preferredName), after });
    }
  }
  return res.filter((r) => r.after < args.min);
}

/* Days a contractor claims on muster against the days the gate saw each worker. */
export function musterVsGate(workerIds: string[], date: string, passes: GatePass[], events: GateEvent[]) {
  return workerIds.map((id) => {
    const passIds = new Set(passes.filter((p) => p.workerId === id).map((p) => p.id));
    const seen = events.some((e) => passIds.has(e.passId) && e.direction === "in" && e.time.startsWith(date));
    return { workerId: id, seen };
  });
}

/* Crew members inside the plant now, for a manager's own team. */
export function crewInside(team: Employee[], punches: Punch[]) {
  return team.filter((e) => openPair(punchesOn(punches, e.id)).inside).length;
}

/* Payroll cost per unit for a run: gross, employer cost and net. */
export function costByUnit(run: PayrollRun, employees: Employee[]) {
  const unit = new Map(employees.map((e) => [e.id, e.unitId]));
  const map = new Map<string, { unit: string; gross: number; employer: number; net: number; heads: number }>();
  for (const r of run.results) {
    const id = unit.get(r.employeeId) ?? "other";
    const row = map.get(id) ?? { unit: unitName(id), gross: 0, employer: 0, net: 0, heads: 0 };
    row.gross += r.gross;
    row.net += r.net;
    row.employer += r.lines.filter((l) => l.type === "employer").reduce((n, l) => n + l.amount, 0);
    row.heads += 1;
    map.set(id, row);
  }
  return [...map.values()].sort((a, b) => b.gross - a.gross);
}

/* Contract workers inside now, for one contractor's crew. */
export function insideFor(workers: ContractWorker[], events: GateEvent[], passes: GatePass[]) {
  return insideNow(events, passes, new Set(workers.map((w) => w.id))).size;
}

import { DEMO_TODAY } from "./demo";
import type { Punch, RosterEntry, ShiftPattern } from "./types";

function minutes(hhmm: string) {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

function punchMinutes(iso: string) {
  const t = iso.slice(11, 16);
  return minutes(t);
}

export function workedMinutes(punches: Punch[], date: string, employeeId?: string) {
  const day = punches
    .filter((p) => p.time.startsWith(date) && (!employeeId || p.employeeId === employeeId))
    .sort((a, b) => a.time.localeCompare(b.time));
  let inn: Punch | undefined;
  let total = 0;
  for (const p of day) {
    if (p.kind === "in") inn = p;
    else if (p.kind === "out" && inn) {
      total += punchMinutes(p.time) - punchMinutes(inn.time);
      if (total < 0) total += 24 * 60;
      inn = undefined;
    }
  }
  return { minutes: total, inn: day.find((p) => p.kind === "in"), out: [...day].reverse().find((p) => p.kind === "out") };
}

export function shiftFlags(args: {
  punches: Punch[];
  date: string;
  shift: ShiftPattern | undefined;
  employeeId?: string;
}) {
  if (!args.shift || args.shift.code === "OFF" || !args.shift.start) {
    return { lateMinutes: 0, earlyMinutes: 0, overtime: 0, hours: 0 };
  }
  const { minutes: worked, inn, out } = workedMinutes(args.punches, args.date, args.employeeId);
  const start = minutes(args.shift.start);
  const lateMinutes = inn ? Math.max(0, punchMinutes(inn.time) - start - 10) : 0;
  const end = minutes(args.shift.end || args.shift.start);
  const earlyMinutes = out && args.shift.end && args.shift.end !== "06:00" ? Math.max(0, end - 10 - punchMinutes(out.time)) : 0;
  let expected = end - start;
  if (expected <= 0) expected += 24 * 60;
  const overtime = Math.max(0, Math.round(((worked - expected) / 60) * 10) / 10);
  return { lateMinutes, earlyMinutes, overtime, hours: Math.round((worked / 60) * 10) / 10 };
}

export function restHours(args: {
  fromShift: ShiftPattern | undefined;
  toShift: ShiftPattern | undefined;
}): number {
  if (!args.fromShift?.end || !args.toShift?.start) return 24;
  const end = minutes(args.fromShift.end);
  const start = minutes(args.toShift.start);
  let gap = start - end;
  if (gap <= 0) gap += 24 * 60;
  return gap / 60;
}

export function canSwap(args: {
  restHours: number;
  minRest: number;
}): { ok: boolean; reason?: string } {
  if (args.restHours + 0.01 < args.minRest) {
    return { ok: false, reason: `Swap leaves ${args.restHours.toFixed(1)}h rest. Minimum is ${args.minRest}h.` };
  }
  return { ok: true };
}

export function nextRosterDays(from = DEMO_TODAY, n = 14) {
  const out: string[] = [];
  const start = Date.parse(`${from}T00:00:00`);
  for (let i = 0; i < n; i++) {
    const d = new Date(start + i * 86400000);
    out.push(d.toISOString().slice(0, 10));
  }
  return out;
}

export function cycleShift(crew: "A" | "B" | "C" | "D", date: string): string {
  const crewShift: Record<string, string[]> = {
    A: ["M", "M", "A", "A", "N", "N", "OFF"],
    B: ["A", "A", "N", "N", "OFF", "M", "M"],
    C: ["N", "N", "OFF", "M", "M", "A", "A"],
    D: ["OFF", "M", "M", "A", "A", "N", "N"],
  };
  const day = Math.floor(Date.parse(`${date}T00:00:00`) / 86400000);
  return crewShift[crew][((day % 7) + 7) % 7];
}

export function generateRoster(employees: { id: string; crew?: "A" | "B" | "C" | "D" }[], from: string, days: number): RosterEntry[] {
  const dates = nextRosterDays(from, days);
  const rows: RosterEntry[] = [];
  let i = 0;
  for (const e of employees.filter((x) => x.crew)) {
    for (const date of dates) {
      rows.push({ id: `ro-g-${i++}`, employeeId: e.id, date, shiftId: cycleShift(e.crew!, date) });
    }
  }
  return rows;
}

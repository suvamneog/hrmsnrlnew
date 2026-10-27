import type { Punch } from "./types";

export const DEMO_TODAY = "2026-10-27";

export function punchesOn(punches: Punch[], employeeId: string, day = DEMO_TODAY) {
  return punches
    .filter((p) => p.employeeId === employeeId && p.time.startsWith(day))
    .sort((a, b) => a.time.localeCompare(b.time));
}

export function openPair(today: Punch[]) {
  let inn: Punch | undefined;
  let out: Punch | undefined;
  for (const p of today) {
    if (p.kind === "in") {
      inn = p;
      out = undefined;
    } else {
      out = p;
    }
  }
  return { inn, out, inside: Boolean(inn && !out) };
}

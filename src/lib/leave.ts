import { addDays, format, parseISO } from "date-fns";
import type { Holiday, LeaveBalance, LeaveType, LocationId, RosterEntry } from "./types";

export function eachDate(from: string, to: string): string[] {
  if (to < from) return [];
  const out: string[] = [];
  let d = parseISO(from);
  const end = parseISO(to);
  while (d <= end) {
    out.push(format(d, "yyyy-MM-dd"));
    d = addDays(d, 1);
  }
  return out;
}

export function countLeaveDays(args: {
  from: string;
  to: string;
  locationId: LocationId;
  employeeId: string;
  holidays: Holiday[];
  roster: RosterEntry[];
  halfDay?: "am" | "pm";
}): number {
  const days = eachDate(args.from, args.to);
  if (days.length === 0) return 0;
  let n = 0;
  for (const date of days) {
    const ro = args.roster.find((r) => r.employeeId === args.employeeId && r.date === date);
    if (ro?.shiftId === "OFF") continue;
    const hol = args.holidays.some(
      (h) => h.date === date && (!h.locationId || h.locationId === args.locationId),
    );
    if (hol) continue;
    if (!ro) {
      const dow = parseISO(date).getDay();
      if (dow === 0) continue;
    }
    n += 1;
  }
  if (args.halfDay && n >= 1) return Math.max(0.5, n - 0.5);
  return n;
}

export function validateLeave(args: {
  type: LeaveType | undefined;
  days: number;
  balance: LeaveBalance | undefined;
  halfDay?: "am" | "pm";
  gender?: "M" | "F" | "O";
  pendingDays?: number;
  overlaps?: boolean;
}): { ok: boolean; reason?: string } {
  if (!args.type) return { ok: false, reason: "Unknown leave type" };
  if (args.type.gender && args.gender !== args.type.gender) return { ok: false, reason: `You are not eligible for ${args.type.name.toLowerCase()}.` };
  if (args.overlaps) return { ok: false, reason: "You already have leave on some of these dates." };
  if (args.days <= 0) return { ok: false, reason: "No working days in that range (weekly off or holiday)." };
  if (args.halfDay && !args.type.halfDay) return { ok: false, reason: `${args.type.name} cannot be taken as a half day.` };
  if (args.type.maxPerSpell && args.days > args.type.maxPerSpell) {
    return { ok: false, reason: `${args.type.name} is limited to ${args.type.maxPerSpell} ${args.type.maxPerSpell === 1 ? "day" : "days"} at a time. Shorten the dates.` };
  }
  // Days already waiting for approval are held against the balance.
  const bal = (args.balance?.balance ?? 0) - (args.pendingDays ?? 0);
  if (args.days > bal) return { ok: false, reason: `Only ${Math.max(0, bal)} ${args.type.code} days left after pending requests.` };
  return { ok: true };
}

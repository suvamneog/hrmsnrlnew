import type { Advance, Employee, LeaveBalance, PolicySetting } from "./types";
import { settingOn } from "./payroll";

function years(doj: string, lastDay: string) {
  const a = Date.parse(`${doj}T00:00:00`);
  const b = Date.parse(`${lastDay}T00:00:00`);
  return Math.max(0, (b - a) / (365.25 * 86400000));
}

export function computeFf(args: {
  employee: Employee;
  lastDay: string;
  settings: PolicySetting[];
  elBalance: LeaveBalance | undefined;
  advances: Advance[];
}) {
  const { employee: e, lastDay, settings } = args;
  const daPct = settingOn(settings, "da.ida", lastDay, e.cadre);
  const da = e.basic * (daPct / 100);
  const y = years(e.doj, lastDay);
  const gratuity = y >= 5 ? Math.round((15 / 26) * (e.basic + da) * y) : 0;
  const el = args.elBalance?.balance ?? 0;
  const leaveEncashment = Math.round((e.basic / 30) * el);
  const recoveries = args.advances
    .filter((a) => a.employeeId === e.id)
    .reduce((s, a) => s + a.outstanding, 0);
  const netFf = gratuity + leaveEncashment - recoveries;
  return { years: Math.round(y * 10) / 10, gratuity, leaveEncashment, recoveries, netFf };
}

export const CLAIM_LIMITS: Record<string, Record<string, number>> = {
  E7: { medical: 80000, ltc: 120000, cea: 27000, tour: 80000, cafeteria: 20000 },
  E6: { medical: 70000, ltc: 100000, cea: 27000, tour: 60000, cafeteria: 18000 },
  E5: { medical: 60000, ltc: 90000, cea: 27000, tour: 50000, cafeteria: 16000 },
  E4: { medical: 50000, ltc: 80000, cea: 27000, tour: 40000, cafeteria: 14000 },
  E3: { medical: 40000, ltc: 70000, cea: 27000, tour: 30000, cafeteria: 12000 },
  E2: { medical: 30000, ltc: 50000, cea: 27000, tour: 25000, cafeteria: 10000 },
  ET: { medical: 20000, ltc: 0, cea: 0, tour: 15000, cafeteria: 5000 },
  W6: { medical: 25000, ltc: 40000, cea: 27000, tour: 15000, cafeteria: 8000 },
  W5: { medical: 22000, ltc: 35000, cea: 27000, tour: 12000, cafeteria: 7000 },
  W4: { medical: 20000, ltc: 30000, cea: 27000, tour: 10000, cafeteria: 6000 },
  W3: { medical: 18000, ltc: 25000, cea: 27000, tour: 8000, cafeteria: 5000 },
  W2: { medical: 15000, ltc: 20000, cea: 27000, tour: 6000, cafeteria: 4000 },
};

export function claimLimit(grade: string, type: string) {
  return CLAIM_LIMITS[grade]?.[type] ?? 15000;
}

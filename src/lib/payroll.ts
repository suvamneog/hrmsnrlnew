import { isGenerated } from "./headcount";
import type {
  Advance,
  AttendanceDay,
  Cadre,
  Claim,
  Employee,
  LocationId,
  PayFlag,
  PayLine,
  PayResult,
  PolicySetting,
} from "./types";

function num(v: number | string) {
  return typeof v === "number" ? v : Number(v);
}

export function settingOn(
  settings: PolicySetting[],
  key: string,
  onDate: string,
  cadre?: Cadre,
  fallback = 0,
) {
  // Each setting carries its earlier versions, so a past month reads the value that was in force then.
  const row = settings
    .filter((s) => s.key === key)
    .filter((s) => !s.cadre || s.cadre === "all" || s.cadre === cadre)
    .flatMap((s) => [
      { value: s.value, validFrom: s.validFrom, validTo: s.validTo, approvedBy: s.approvedBy },
      ...(s.versions ?? []),
    ])
    .filter((v) => v.validFrom <= onDate && (!v.validTo || v.validTo >= onDate))
    .filter((v) => v.approvedBy)
    .sort((a, b) => b.validFrom.localeCompare(a.validFrom))[0];
  return row ? num(row.value) : fallback;
}

function round2(n: number) {
  return Math.round(n * 100) / 100;
}

function hraRate(locationId: LocationId, daPct: number, settings: PolicySetting[], onDate: string) {
  if (daPct < 50) {
    return settingOn(settings, `hra.${locationId}.pre50`, onDate) ||
      settingOn(settings, "hra.z", onDate);
  }
  const city = locationId === "siliguri" ? "y" : "z";
  return settingOn(settings, `hra.${city}`, onDate);
}

function professionalTax(locationId: LocationId, monthlyGross: number) {
  if (locationId === "siliguri") {
    if (monthlyGross <= 10000) return 0;
    if (monthlyGross <= 15000) return 110;
    if (monthlyGross <= 25000) return 130;
    return 200;
  }
  if (locationId === "paradip") {
    if (monthlyGross <= 13304) return 0;
    if (monthlyGross <= 25000) return 125;
    return 200;
  }
  if (monthlyGross <= 10000) return 0;
  if (monthlyGross <= 15000) return 150;
  if (monthlyGross <= 25000) return 180;
  return 208;
}

function estimateTds(annualEstimate: number, regime: "new" | "old" = "new") {
  const slabs =
    regime === "new"
      ? [
          [400000, 0],
          [800000, 0.05],
          [1200000, 0.1],
          [1600000, 0.15],
          [2000000, 0.2],
          [2400000, 0.25],
          [Infinity, 0.3],
        ]
      : [
          [250000, 0],
          [500000, 0.05],
          [1000000, 0.2],
          [Infinity, 0.3],
        ];
  let tax = 0;
  let prev = 0;
  for (const [cap, rate] of slabs) {
    const slice = Math.min(annualEstimate, cap as number) - prev;
    if (slice > 0) tax += slice * (rate as number);
    prev = cap as number;
    if (annualEstimate <= cap) break;
  }
  return round2(tax / 12);
}

export function computeEmployeePay(args: {
  employee: Employee;
  month: string;
  onDate: string;
  settings: PolicySetting[];
  attendance: AttendanceDay[];
  claims: Claim[];
  advances: Advance[];
  sapNet?: number;
  sapLines?: PayLine[];
  arrears?: number;
  sapMode?: boolean;
}): PayResult {
  const { employee: e0, onDate, settings, attendance, claims, advances, sapNet, sapMode } = args;
  // Pay follows the assignment in force on the run date, so a future-dated promotion waits for its month.
  const asg = e0.assignmentHistory.find(
    (a) => a.basic !== undefined && a.validFrom <= onDate && (!a.validTo || a.validTo > onDate),
  );
  const e = asg ? { ...e0, grade: asg.grade, basic: asg.basic ?? e0.basic } : e0;
  const lines: PayLine[] = [];
  const flags: PayFlag[] = [];

  const daPct = sapMode
    ? settingOn(settings, "da.ida.sap", onDate, e.cadre) || settingOn(settings, "da.ida", onDate, e.cadre)
    : settingOn(settings, "da.ida", onDate, e.cadre);
  const da = round2(e.basic * (daPct / 100));
  const perkCap = round2(e.basic * (settingOn(settings, "perks.cap", onDate, e.cadre, 35) / 100));
  const cafeteria = round2(e.basic * (e.cafeteriaPct / 100));
  const perks = Math.min(cafeteria, perkCap);
  const hra =
    (!sapMode && e.quarterId) || e.cadre === "contract"
      ? 0
      : round2(e.basic * (hraRate(e.locationId, daPct, settings, onDate) / 100));
  const otHours = attendance.reduce((s, d) => s + d.overtime, 0);
  const otRate = settingOn(settings, "ot.hourly", onDate, e.cadre, e.basic / 208);
  const ot = round2(otHours * otRate);
  const shiftDays = attendance.filter((d) => d.status === "present" && d.shiftId && d.shiftId !== "OFF").length;
  const shiftAll =
    e.crew && (e.cadre === "workman" || e.cadre === "executive")
      ? round2(shiftDays * (settingOn(settings, "shift.allowance", onDate, e.cadre, 180)))
      : 0;
  const approvedClaims = claims
    .filter((c) => c.employeeId === e.id && c.status === "approved")
    .reduce((s, c) => s + c.amount, 0);

  lines.push({ code: "BASIC", label: "Basic pay", type: "earning", amount: e.basic });
  lines.push({ code: "DA", label: `Dearness allowance (${daPct}%)`, type: "earning", amount: da });
  if (perks) lines.push({ code: "PERKS", label: "Cafeteria perks", type: "earning", amount: perks });
  if (e.hardshipAllowance)
    lines.push({
      code: "HARDSHIP",
      label: "Hardship / project allowance",
      type: "earning",
      amount: e.hardshipAllowance,
    });
  if (hra) lines.push({ code: "HRA", label: "House rent allowance", type: "earning", amount: hra });
  if (shiftAll) lines.push({ code: "SHIFT", label: "Shift allowance", type: "earning", amount: shiftAll });
  if (ot) lines.push({ code: "OT", label: `Overtime (${otHours.toFixed(1)} hrs)`, type: "earning", amount: ot });
  if (approvedClaims)
    lines.push({ code: "CLAIMS", label: "Reimbursements", type: "earning", amount: approvedClaims });
  if (args.arrears)
    lines.push({ code: "ARR", label: "Arrears (backdated rule)", type: "earning", amount: round2(args.arrears) });

  const gross = round2(lines.filter((l) => l.type === "earning").reduce((s, l) => s + l.amount, 0));
  const wageBase = e.basic + da;
  const wageShare = gross > 0 ? wageBase / gross : 1;
  const addBack = wageShare < 0.5 ? round2(gross * 0.5 - wageBase) : 0;
  const statutoryWages = round2(wageBase + addBack);

  const pfRate = settingOn(settings, "pf.rate", onDate, undefined, 12);
  const pfEmp = round2(statutoryWages * (pfRate / 100));
  const pfEr = pfEmp;
  const npsRate = e.cadre === "executive" || e.cadre === "trainee" ? settingOn(settings, "nps.rate", onDate, undefined, 10) : 0;
  const nps = round2((e.basic + da) * (npsRate / 100));
  const gratuityProv = round2((e.basic + da) * 0.0481);
  const prms = e.cadre === "executive" ? round2((e.basic + da) * 0.03) : 0;
  const employerSuper = pfEr + nps + gratuityProv + prms;
  const superBase = e.basic + da;
  const superPct = superBase > 0 ? (employerSuper / superBase) * 100 : 0;
  const superCap = settingOn(settings, "super.cap", onDate, e.cadre, 30);

  const pt = professionalTax(e.locationId, gross);
  const tds = estimateTds(gross * 12);
  const recovery = advances
    .filter((a) => a.employeeId === e.id)
    .reduce((s, a) => s + a.monthlyRecovery, 0);
  const licence = e.quarterId ? settingOn(settings, `licence.${e.quarterId}`, onDate) : 0;

  if (pfEmp) lines.push({ code: "PF", label: "Provident fund", type: "deduction", amount: pfEmp });
  if (nps) lines.push({ code: "NPS", label: "NPS (employee)", type: "deduction", amount: nps });
  if (pt) lines.push({ code: "PT", label: "Professional tax", type: "deduction", amount: pt });
  if (tds) lines.push({ code: "TDS", label: "Income tax (TDS)", type: "deduction", amount: tds });
  if (licence) lines.push({ code: "QLF", label: "Quarter licence fee", type: "deduction", amount: licence });
  if (recovery)
    lines.push({ code: "ADV", label: "Advance recovery", type: "deduction", amount: recovery });

  if (pfEr) lines.push({ code: "PF_ER", label: "PF employer", type: "employer", amount: pfEr });
  if (nps) lines.push({ code: "NPS_ER", label: "NPS employer", type: "employer", amount: nps });
  if (gratuityProv)
    lines.push({ code: "GRAT_P", label: "Gratuity provision", type: "employer", amount: gratuityProv });
  if (prms) lines.push({ code: "PRMS", label: "Post-retirement medical", type: "employer", amount: prms });

  const deductions = round2(lines.filter((l) => l.type === "deduction").reduce((s, l) => s + l.amount, 0));
  const net = round2(gross - deductions);
  const perkPct = e.basic > 0 ? (perks / e.basic) * 100 : 0;

  if (cafeteria > perkCap + 0.5) {
    flags.push({
      code: "perks_over_35",
      severity: "warn",
      message: `Cafeteria perks ${pct(perkPct)} exceed the 35% DPE cap. Capped at ${perkCap.toFixed(0)} for this run.`,
    });
  }
  if (superPct > superCap + 0.05) {
    flags.push({
      code: "super_over_30",
      severity: "block",
      message: `Superannuation ${pct(superPct)} exceeds the ${superCap}% cap on basic plus DA.`,
    });
  }
  if (wageShare < 0.5) {
    flags.push({
      code: "wage_share_under_50",
      severity: "block",
      message: `Wages are ${pct(wageShare * 100)} of pay. Labour Code add-back of ${addBack.toFixed(0)} applied for PF and gratuity.`,
    });
  }
  if (net < 0) {
    flags.push({
      code: "negative_net",
      severity: "block",
      message: "Net pay is negative. Reduce recoveries before finance can approve.",
    });
  }
  if (!e.bankAccount) {
    flags.push({
      code: "missing_bank",
      severity: "block",
      message: "Bank account missing. Salary file cannot include this person.",
    });
  }

  return {
    employeeId: e.id,
    month: args.month,
    lines,
    gross,
    deductions,
    net,
    wageShare,
    perkPct,
    superPct,
    flags,
    sapNet,
    sapLines: args.sapLines,
    arrears: args.arrears,
  };
}

function pct(n: number) {
  return `${n.toFixed(1)}%`;
}

function groupBy<T>(rows: T[], key: (r: T) => string) {
  const m = new Map<string, T[]>();
  for (const r of rows) {
    const k = key(r);
    const list = m.get(k);
    if (list) list.push(r);
    else m.set(k, [r]);
  }
  return m;
}

export function computeRun(args: {
  employees: Employee[];
  month: string;
  onDate: string;
  settings: PolicySetting[];
  attendance: AttendanceDay[];
  claims: Claim[];
  advances: Advance[];
  arrearsFor: (e: Employee) => number;
}) {
  const t0 = typeof performance !== "undefined" ? performance.now() : Date.now();
  const payable = args.employees.filter(
    (e) => (e.status === "active" || e.status === "probation" || e.status === "notice") && e.cadre !== "contract",
  );
  const attBy = groupBy(
    args.attendance.filter((a) => a.date.startsWith(args.month)),
    (a) => a.employeeId,
  );
  const none: AttendanceDay[] = [];
  const results = payable.map((e) => {
    const attendance = attBy.get(e.id) ?? none;
    const generated = isGenerated(e.id);
    if (generated) {
      return computeEmployeePay({
        employee: e,
        month: args.month,
        onDate: args.onDate,
        settings: args.settings,
        attendance,
        claims: [],
        advances: [],
      });
    }
    const sap = computeEmployeePay({
      employee: e,
      month: args.month,
      onDate: args.onDate,
      settings: args.settings,
      attendance,
      claims: args.claims,
      advances: args.advances,
      sapMode: true,
    });
    return computeEmployeePay({
      employee: e,
      month: args.month,
      onDate: args.onDate,
      settings: args.settings,
      attendance,
      claims: args.claims,
      advances: args.advances,
      sapNet: sap.net,
      sapLines: sap.lines,
      arrears: args.arrearsFor(e),
    });
  });
  const ms = Math.round((typeof performance !== "undefined" ? performance.now() : Date.now()) - t0);
  return {
    results,
    totals: {
      employees: results.length,
      net: round2(results.reduce((s, r) => s + r.net, 0)),
      gross: round2(results.reduce((s, r) => s + r.gross, 0)),
      sapDiffs: results.filter((r) => r.sapNet && Math.abs(r.sapNet - r.net) > 1).length,
      blockers: results.filter((r) => r.flags.some((f) => f.severity === "block")).length,
      ms,
    },
  };
}

export const PAYROLL_STAGES: { id: import("./types").PayrollStage; label: string; hint: string }[] = [
  { id: "attendance_lock", label: "Attendance lock", hint: "Close punches and leave for the month." },
  { id: "inputs", label: "Inputs", hint: "Arrears, claims, recoveries, one-time payments." },
  { id: "compute", label: "Compute", hint: "Run the dated rules engine for both cadres." },
  { id: "validate", label: "Validate", hint: "Block on DPE caps, wage share, bank, negative net." },
  { id: "finance_approval", label: "Finance approval", hint: "A different person must release the bank file." },
  { id: "bank_file", label: "Bank file", hint: "SBI salary upload, EPFO ECR, NPS, PT." },
  { id: "publish", label: "Publish", hint: "Payslips to employees. Parallel SAP report stays on file." },
];

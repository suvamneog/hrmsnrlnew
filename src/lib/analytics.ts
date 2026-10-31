import { addDays, differenceInCalendarDays, format, parseISO } from "date-fns";
import { DEMO_TODAY, openPair, punchesOn } from "./demo";
import { insideNow } from "./gate";
import { restHours, cycleShift } from "./time-rules";
import type {
  AttendanceDay,
  Candidate,
  Certificate,
  Contractor,
  ContractWorker,
  Course,
  Employee,
  GateEvent,
  GatePass,
  LeaveBalance,
  LeaveRequest,
  LeaveType,
  Opening,
  PayrollRun,
  Punch,
  Quarter,
  RosterEntry,
  ShiftPattern,
  SwapRequest,
} from "./types";
import { shiftFlags } from "./time-rules";

const day = (iso: string) => format(parseISO(iso), "d MMM");
const hourOf = (iso: string) => Number(iso.slice(11, 13)) + Number(iso.slice(14, 16)) / 60;
const daysTo = (iso: string) => differenceInCalendarDays(parseISO(iso), parseISO(DEMO_TODAY));

/* Attendance mix per day: on time, late, missing punch, on leave. */
export function attendanceMix(attendance: AttendanceDay[], punches: Punch[], shifts: ShiftPattern[], days = 30) {
  const start = format(addDays(parseISO(DEMO_TODAY), -(days - 1)), "yyyy-MM-dd");
  const dates = [...new Set(attendance.map((a) => a.date))].filter((d) => d >= start && d <= DEMO_TODAY).sort();
  return dates.map((date) => {
    const rows = attendance.filter((a) => a.date === date);
    let late = 0;
    let present = 0;
    for (const a of rows.filter((x) => x.status === "present")) {
      const f = shiftFlags({ punches, date, shift: shifts.find((s) => s.id === a.shiftId), employeeId: a.employeeId });
      if (f.lateMinutes > 0) late += 1;
      else present += 1;
    }
    return {
      day: day(date),
      present,
      late,
      absent: rows.filter((a) => a.status === "missing_punch").length,
      leave: rows.filter((a) => a.status === "leave").length,
    };
  });
}

/* Today's manning per crew: rostered on a working shift against those actually in. */
export function crewCoverage(employees: Employee[], roster: RosterEntry[], attendance: AttendanceDay[], punches: Punch[]) {
  return (["A", "B", "C", "D"] as const).map((crew) => {
    const members = employees.filter((e) => e.crew === crew);
    const planned = members.filter((e) => {
      const r = roster.find((x) => x.employeeId === e.id && x.date === DEMO_TODAY);
      return r && r.shiftId !== "OFF";
    });
    const actual = planned.filter((e) => {
      const a = attendance.find((x) => x.employeeId === e.id && x.date === DEMO_TODAY);
      return a?.status === "present" || openPair(punchesOn(punches, e.id)).inside;
    });
    const shift = cycleShift(crew, DEMO_TODAY);
    return { crew: `Crew ${crew}`, shift, planned: planned.length, actual: actual.length };
  });
}

/* Gate movements per hour today, entries and exits. */
export function gateByHour(events: GateEvent[], from = 5, to = 21) {
  const today = events.filter((e) => e.time.startsWith(DEMO_TODAY));
  return Array.from({ length: to - from + 1 }, (_, i) => {
    const h = from + i;
    const at = today.filter((e) => Math.floor(hourOf(e.time)) === h);
    return { hour: `${String(h).padStart(2, "0")}:00`, in: at.filter((e) => e.direction === "in").length, out: at.filter((e) => e.direction === "out").length };
  });
}

/* Who was inside at each hour today: staff from biometric punches, contract workers from gate events. */
export function inPlantByHour(events: GateEvent[], passes: GatePass[], punches: Punch[], from = 5, to = 21) {
  const staffToday = punches.filter((p) => p.time.startsWith(DEMO_TODAY));
  const staffIds = [...new Set(staffToday.map((p) => p.employeeId))];
  return Array.from({ length: to - from + 1 }, (_, i) => {
    const h = from + i;
    const cut = `${DEMO_TODAY}T${String(h).padStart(2, "0")}:59:59+05:30`;
    const contract = insideNow(events.filter((e) => e.time <= cut), passes).size;
    const staff = staffIds.filter((id) => {
      const mine = staffToday.filter((p) => p.employeeId === id && p.time <= cut).sort((a, b) => a.time.localeCompare(b.time));
      return mine.at(-1)?.kind === "in";
    }).length;
    return { hour: `${String(h).padStart(2, "0")}:00`, staff, contract };
  });
}

/* Blocked gate passes grouped by the check that failed. */
export function blockedByReason(passes: GatePass[], workers: ContractWorker[], contractors: Contractor[]) {
  const buckets = { Police: 0, Medical: 0, Induction: 0, Licence: 0, Certificate: 0 };
  for (const p of passes.filter((x) => x.blocked)) {
    const w = workers.find((x) => x.id === p.workerId);
    const c = contractors.find((x) => x.id === w?.contractorId);
    if (w && !w.policeVerification) buckets.Police += 1;
    else if (w && w.medicalFitnessExpiry < DEMO_TODAY) buckets.Medical += 1;
    else if (w && !w.inductionPassed) buckets.Induction += 1;
    else if (c && c.licenceExpiry < DEMO_TODAY) buckets.Licence += 1;
    else buckets.Certificate += 1;
  }
  return Object.entries(buckets).map(([reason, count]) => ({ reason, count }));
}

/* Present heads per day split by shift. */
export function attendanceByShift(attendance: AttendanceDay[], days = 30) {
  const start = format(addDays(parseISO(DEMO_TODAY), -(days - 1)), "yyyy-MM-dd");
  const dates = [...new Set(attendance.map((a) => a.date))].filter((d) => d >= start && d <= DEMO_TODAY).sort();
  return dates.map((date) => {
    const rows = attendance.filter((a) => a.date === date && a.status === "present");
    return {
      day: day(date),
      M: rows.filter((a) => a.shiftId === "M").length,
      A: rows.filter((a) => a.shiftId === "A").length,
      N: rows.filter((a) => a.shiftId === "N").length,
      G: rows.filter((a) => a.shiftId === "G").length,
    };
  });
}

/* One person's last two weeks: rostered window against actual punches. */
export function punchTimeline(employeeId: string, roster: RosterEntry[], shifts: ShiftPattern[], punches: Punch[], attendance: AttendanceDay[], days = 14) {
  const toH = (hhmm: string) => Number(hhmm.slice(0, 2)) + Number(hhmm.slice(3, 5)) / 60;
  return Array.from({ length: days }, (_, i) => format(addDays(parseISO(DEMO_TODAY), i - days + 1), "yyyy-MM-dd")).map((date) => {
    const r = roster.find((x) => x.employeeId === employeeId && x.date === date);
    const sh = shifts.find((s) => s.id === r?.shiftId);
    const a = attendance.find((x) => x.employeeId === employeeId && x.date === date);
    const mine = punches.filter((p) => p.employeeId === employeeId && p.time.startsWith(date)).sort((x, y) => x.time.localeCompare(y.time));
    const inn = mine.find((p) => p.kind === "in");
    const out = inn ? punches.filter((p) => p.employeeId === employeeId && p.kind === "out" && p.time > inn.time).sort((x, y) => x.time.localeCompare(y.time))[0] : undefined;
    const f = shiftFlags({ punches, date, shift: sh, employeeId });
    const shiftWin: [number, number] | undefined = sh?.start ? [toH(sh.start), toH(sh.end) <= toH(sh.start) ? 24 : toH(sh.end)] : undefined;
    const outH = out ? (out.time.slice(0, 10) > date ? 24 : hourOf(out.time)) : inn && date === DEMO_TODAY ? Math.min(24, hourOf(inn.time) + 2) : undefined;
    const punch: [number, number] | undefined = inn && outH !== undefined ? [hourOf(inn.time), outH] : undefined;
    const flag = a?.status === "missing_punch" ? "missing" : f.lateMinutes > 0 ? "late" : f.earlyMinutes > 0 ? "early" : undefined;
    const fmt = (p?: Punch) => (p ? p.time.slice(11, 16) : "—");
    return {
      key: date,
      label: format(parseISO(date), "EEE d"),
      shift: shiftWin,
      punch,
      flag: flag as "late" | "early" | "missing" | undefined,
      detail: [
        r?.shiftId === "OFF" ? "Weekly off" : `${sh?.label ?? "No roster"}${sh?.start ? ` ${sh.start}–${sh.end}` : ""}`,
        `In ${fmt(inn)}, Out ${fmt(out)}`,
        flag === "late" ? `Late by ${f.lateMinutes} min` : flag === "early" ? `Left ${f.earlyMinutes} min early` : flag === "missing" ? "No check-in" : "On time",
      ],
    };
  });
}

/* Shift per person for the next two weeks, with swaps and short rest flagged. */
/* `back` days before today are included too, so a roster can show last week next to what is coming. */
export function rosterGrid(people: Employee[], roster: RosterEntry[], shifts: ShiftPattern[], swaps: SwapRequest[], minRest: number, days = 14, back = 0) {
  const dates = Array.from({ length: days + back }, (_, i) => format(addDays(parseISO(DEMO_TODAY), i - back), "yyyy-MM-dd"));
  const shiftOf = (e: Employee, date: string) =>
    roster.find((r) => r.employeeId === e.id && r.date === date)?.shiftId ?? (e.crew ? cycleShift(e.crew, date) : "G");
  const cells = new Map<string, { code: string; swap: boolean; rest?: number }>();
  for (const e of people) {
    dates.forEach((date, i) => {
      const code = shiftOf(e, date);
      const prevDate = i === 0 ? format(addDays(parseISO(date), -1), "yyyy-MM-dd") : dates[i - 1];
      const prev = shiftOf(e, prevDate);
      const rest =
        code !== "OFF" && prev !== "OFF"
          ? restHours({ fromShift: shifts.find((s) => s.id === prev), toShift: shifts.find((s) => s.id === code) })
          : undefined;
      const swap = swaps.some((s) => s.date === date && s.status !== "rejected" && (s.fromId === e.id || s.toId === e.id));
      cells.set(`${e.id}|${date}`, { code, swap, rest: rest !== undefined && rest < minRest ? rest : undefined });
    });
  }
  return { dates, cells };
}

/* Workers inside now against the licence ceiling, per contractor. */
export function contractorLoad(contractors: Contractor[], workers: ContractWorker[], events: GateEvent[], passes: GatePass[]) {
  return contractors.map((c) => {
    const crew = workers.filter((w) => w.contractorId === c.id);
    const inside = insideNow(events, passes, new Set(crew.map((w) => w.id))).size;
    return { name: c.name.replace(/ (Ltd|Limited|\(India\)).*$/, ""), inside, headroom: Math.max(0, (c.capacity ?? crew.length) - inside), registered: crew.length, capacity: c.capacity ?? crew.length };
  });
}

/* Licences and certificates running out soon, in 7, 14 and 30 day windows. */
export function expiryWindows(contractors: Contractor[], certs: Certificate[], workerIds?: Set<string>) {
  const mine = certs.filter((c) => c.personKind === "contract" && (!workerIds || workerIds.has(c.personId)));
  const bucket = (d: number) => (d < 0 ? "expired" : d <= 7 ? "d7" : d <= 14 ? "d14" : d <= 30 ? "d30" : null);
  const row = (label: string, dates: string[]) => {
    const r = { label, expired: 0, d7: 0, d14: 0, d30: 0 };
    for (const d of dates) {
      const b = bucket(daysTo(d));
      if (b) r[b] += 1;
    }
    return r;
  };
  return [row("Licences", contractors.map((c) => c.licenceExpiry)), row("Certificates", mine.map((c) => c.expires))];
}

/* Certificates by course, expired and due over the next 90 days. */
export function certExpiryByCourse(certs: Certificate[], courses: Course[]) {
  return courses
    .map((course) => {
      const rows = certs.filter((c) => c.courseId === course.id);
      const r = { course: course.name.replace(" (OISD-STD-154)", " (OISD)"), expired: 0, d30: 0, d60: 0, d90: 0 };
      for (const c of rows) {
        const d = daysTo(c.expires);
        if (d < 0) r.expired += 1;
        else if (d <= 30) r.d30 += 1;
        else if (d <= 60) r.d60 += 1;
        else if (d <= 90) r.d90 += 1;
      }
      return r;
    })
    .filter((r) => r.expired + r.d30 + r.d60 + r.d90 > 0);
}

/* Headcount per location, executives against everyone else. */
export function headcountByLocation(employees: Employee[]) {
  const names: Record<string, string> = { numaligarh: "Numaligarh", siliguri: "Siliguri", paradip: "Paradip", guwahati: "Guwahati" };
  const on = employees.filter((e) => e.cadre !== "contract" && e.status !== "separated");
  return Object.entries(names).map(([id, label]) => {
    const here = on.filter((e) => e.locationId === id);
    return {
      location: label,
      executives: here.filter((e) => e.cadre === "executive").length,
      workmen: here.filter((e) => e.cadre === "workman").length,
      trainees: here.filter((e) => e.cadre === "trainee").length,
    };
  });
}

/* Totals for the current run by pay component. */
export function payrollComponents(run: PayrollRun) {
  const sum = (code: string) => run.results.reduce((n, r) => n + (r.lines.find((l) => l.code === code)?.amount ?? 0), 0);
  const deductions = run.results.reduce((n, r) => n + r.deductions, 0);
  const net = run.results.reduce((n, r) => n + r.net, 0);
  return [
    { part: "Basic", amount: sum("BASIC") },
    { part: "IDA / DA", amount: sum("DA") },
    { part: "Perks", amount: sum("PERKS") },
    { part: "HRA", amount: sum("HRA") },
    { part: "OT & shift", amount: sum("OT") + sum("SHIFT") },
    { part: "Deductions", amount: deductions },
    { part: "Net pay", amount: net },
  ];
}

/* Leave by type: days applied, days approved, and days left. */
export function leaveByType(types: LeaveType[], requests: LeaveRequest[], balances: LeaveBalance[], employeeId?: string) {
  return types
    .map((t) => {
      const reqs = requests.filter((r) => r.typeId === t.id && (!employeeId || r.employeeId === employeeId));
      const bal = balances.filter((b) => b.typeId === t.id && (!employeeId || b.employeeId === employeeId));
      return {
        type: t.code,
        applied: reqs.filter((r) => r.status === "pending").reduce((n, r) => n + r.days, 0),
        approved: reqs.filter((r) => r.status === "approved").reduce((n, r) => n + r.days, 0),
        balance: bal.reduce((n, b) => n + b.balance, 0),
      };
    })
    .filter((r) => r.applied + r.approved + r.balance > 0);
}

/* Reserved posts per opening against offers and joins already made in that category. */
export function reservationStatus(openings: Opening[], candidates: Candidate[]) {
  return openings.map((o) => {
    const filled = candidates.filter((c) => c.openingId === o.id && (c.stage === "offer" || c.stage === "joined")).length;
    return { post: o.post.replace(/ \(.*\)/, ""), filled, open: Math.max(0, o.vacancies - filled), reserved: o.split.OBC + o.split.SC + o.split.ST + o.split.EWS };
  });
}

/* Township stock and the licence fee it recovers through payroll each month. */
export function townshipRecovery(quarters: Quarter[]) {
  return (["V", "IV", "III", "II"] as const).map((t) => {
    const rows = quarters.filter((q) => q.type === t);
    return {
      type: `Type ${t}`,
      held: rows.filter((q) => q.status === "occupied").length,
      vacant: rows.filter((q) => q.status === "vacant").length,
      repair: rows.filter((q) => q.status === "maintenance").length,
      fee: rows.filter((q) => q.status === "occupied").reduce((n, q) => n + q.licenceFee, 0),
    };
  });
}

// The demo seed holds one separation, so attrition is shown on an illustrative year, clearly labelled.
export const ATTRITION_SAMPLE = [
  { month: "Nov", superannuation: 2, resignation: 1, vrs: 0, death: 0 },
  { month: "Dec", superannuation: 3, resignation: 0, vrs: 1, death: 0 },
  { month: "Jan", superannuation: 2, resignation: 2, vrs: 0, death: 0 },
  { month: "Feb", superannuation: 1, resignation: 1, vrs: 0, death: 1 },
  { month: "Mar", superannuation: 4, resignation: 1, vrs: 0, death: 0 },
  { month: "Apr", superannuation: 2, resignation: 3, vrs: 0, death: 0 },
  { month: "May", superannuation: 3, resignation: 1, vrs: 1, death: 0 },
  { month: "Jun", superannuation: 2, resignation: 2, vrs: 0, death: 0 },
  { month: "Jul", superannuation: 3, resignation: 1, vrs: 0, death: 0 },
  { month: "Aug", superannuation: 2, resignation: 0, vrs: 0, death: 0 },
  { month: "Sep", superannuation: 1, resignation: 2, vrs: 1, death: 0 },
  { month: "Oct", superannuation: 2, resignation: 1, vrs: 0, death: 0 },
];

export const ATTRITION_UNITS_SAMPLE = [
  { unit: "Operations", leavers: 14, interviewed: 12 },
  { unit: "Technical", leavers: 7, interviewed: 6 },
  { unit: "HSE", leavers: 5, interviewed: 5 },
  { unit: "Finance", leavers: 3, interviewed: 2 },
  { unit: "Township", leavers: 2, interviewed: 1 },
];

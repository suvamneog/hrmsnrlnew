"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { canAdvancePayroll } from "./access";
import { DEMO_TODAY, openPair, punchesOn } from "./demo";
import { claimLimit, computeFf } from "./ff";
import { bankFile, claimsBankFile, ecrFile, form24q, npsFile, ptFiles, sapFiFile } from "./files";
import { passBlockReason } from "./gate";
import { countLeaveDays, validateLeave } from "./leave";
import { mergeHeadcount } from "./headcount";
import { parseSapCsv, sapMismatch } from "./sap";
import { NRL_INTERFACES } from "./interfaces";
import { POSITIONS } from "./org";
import { computeRun, settingOn } from "./payroll";
import {
  ADVANCES,
  APPRAISALS,
  ATTENDANCE,
  AUDIT,
  BREACHES,
  CANDIDATES,
  CERTS,
  CHANGES,
  CLAIMS,
  CONSENTS,
  CONTRACTORS,
  COURSES,
  EMPLOYEES,
  GATE_EVENTS,
  GOALS,
  HOLIDAYS,
  INDUCTIONS,
  INITIAL_RUN,
  LEAVE_BALANCES,
  LEAVE_REQUESTS,
  LEAVE_TYPES,
  MAINT,
  NOTES,
  OPENINGS,
  PASSES,
  PRIOR_BANK,
  PUNCHES,
  QUARTERS,
  REGS,
  RETENTION,
  ROSTER,
  ROSTER_POINTS,
  SAP_HR,
  SAP_NET,
  SEPARATIONS,
  SESSIONS,
  SETTINGS,
  SHIFTS,
  SWAPS,
  TAX,
  WAITING,
  WAGE_PROOFS,
  WORKERS,
} from "./seed";
import { canSwap, generateRoster, restHours, shiftFlags } from "./time-rules";
import type {
  Appraisal,
  AttendanceDay,
  AuditEvent,
  BreachIncident,
  Candidate,
  CandidateStage,
  ChangeRequest,
  Claim,
  ContractWorker,
  Employee,
  GateEvent,
  GatePass,
  LeaveRequest,
  LeaveType,
  NotificationItem,
  NrlInterface,
  NrlInterfaceId,
  Opening,
  PayrollRun,
  PayrollStage,
  PolicySetting,
  PolicyVersion,
  Position,
  Punch,
  Regularisation,
  Role,
  StatutoryFile,
  SwapRequest,
  TaxDeclaration,
} from "./types";

const STAGES: PayrollStage[] = [
  "attendance_lock",
  "inputs",
  "compute",
  "validate",
  "finance_approval",
  "bank_file",
  "publish",
];

const CANDIDATE_FLOW: CandidateStage[] = ["applied", "shortlist", "interview", "medical", "offer", "joined"];

function uid(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 8)}`;
}

function stamp() {
  return new Date().toISOString();
}

function log(
  audit: AuditEvent[],
  actorId: string,
  action: string,
  object: string,
  source: string,
  after?: string,
  before?: string,
): AuditEvent[] {
  return [{ id: uid("au"), actorId, action, object, before, after, at: stamp(), source }, ...audit];
}

function notify(
  notes: NotificationItem[],
  userId: string | undefined,
  title: string,
  body: string,
  href: string,
): NotificationItem[] {
  if (!userId) return notes;
  return [{ id: uid("nt"), userId, title, body, href, at: stamp(), read: false }, ...notes];
}

function syncPasses(
  workers: ContractWorker[],
  contractors: typeof CONTRACTORS,
  certs: typeof CERTS,
  existing: GatePass[],
): GatePass[] {
  return workers.map((w, i) => {
    const prev = existing.find((p) => p.workerId === w.id);
    const contractor = contractors.find((c) => c.id === w.contractorId);
    const reason = passBlockReason({ worker: w, contractor, certs });
    return {
      id: prev?.id ?? `gp-${i + 1}`,
      workerId: w.id,
      validFrom: prev?.validFrom ?? DEMO_TODAY,
      validTo: contractor?.workOrderEnd ?? prev?.validTo ?? DEMO_TODAY,
      blocked: Boolean(reason),
      blockReason: reason,
    };
  });
}

function rebuildAttendance(args: {
  roster: typeof ROSTER;
  punches: Punch[];
  holidays: typeof HOLIDAYS;
  shifts: typeof SHIFTS;
  leave: LeaveRequest[];
}): AttendanceDay[] {
  return args.roster
    .filter((r) => r.date <= DEMO_TODAY)
    .map((r) => {
      const holiday = args.holidays.some((h) => h.date === r.date);
      if (r.shiftId === "OFF") {
        return { employeeId: r.employeeId, date: r.date, status: "weekly_off" as const, hours: 0, overtime: 0, shiftId: "OFF" };
      }
      if (holiday) {
        return { employeeId: r.employeeId, date: r.date, status: "holiday" as const, hours: 0, overtime: 0, shiftId: r.shiftId };
      }
      const onLeave = args.leave.some(
        (l) => l.employeeId === r.employeeId && l.status === "approved" && l.from <= r.date && l.to >= r.date,
      );
      if (onLeave) {
        return { employeeId: r.employeeId, date: r.date, status: "leave" as const, hours: 0, overtime: 0, shiftId: r.shiftId };
      }
      const shift = args.shifts.find((s) => s.id === r.shiftId);
      const flags = shiftFlags({ punches: args.punches, date: r.date, shift, employeeId: r.employeeId });
      // Today's shift with an in-punch is still running, not a missed punch.
      if (!flags.hours && r.date === DEMO_TODAY && openPair(punchesOn(args.punches, r.employeeId)).inside) {
        return { employeeId: r.employeeId, date: r.date, status: "present" as const, hours: 0, overtime: 0, shiftId: r.shiftId };
      }
      if (!flags.hours) {
        return {
          employeeId: r.employeeId,
          date: r.date,
          status: "missing_punch" as const,
          hours: 0,
          overtime: 0,
          shiftId: r.shiftId,
          lateMinutes: flags.lateMinutes,
          earlyMinutes: flags.earlyMinutes,
        };
      }
      return {
        employeeId: r.employeeId,
        date: r.date,
        status: "present" as const,
        hours: flags.hours || 8,
        overtime: flags.overtime,
        shiftId: r.shiftId,
        lateMinutes: flags.lateMinutes,
        earlyMinutes: flags.earlyMinutes,
      };
    });
}

function arrearsFor(e: Employee, settings: PolicySetting[], month: string) {
  let total = 0;
  for (const s of settings) {
    if (!s.previousValue || s.validFrom >= month) continue;
    if (s.key !== "da.ida") continue;
    if (s.cadre && s.cadre !== "all" && s.cadre !== e.cadre) continue;
    const oldPct = Number(s.previousValue);
    const newPct = Number(s.value);
    const months = Math.max(1, Math.round((Date.parse(`${month}-01`) - Date.parse(s.validFrom)) / 2.628e9));
    total += e.basic * ((newPct - oldPct) / 100) * Math.min(months, 12);
  }
  return Math.round(total * 100) / 100;
}

export interface HrmsState {
  hydrated: boolean;
  currentUserId: string | null;
  actingRole: Role | null;
  locale: "en" | "hi" | "as";
  gateOffline: boolean;
  gateQueue: GateEvent[];
  employees: Employee[];
  positions: Position[];
  settings: PolicySetting[];
  leaveRequests: LeaveRequest[];
  leaveBalances: typeof LEAVE_BALANCES;
  swaps: SwapRequest[];
  regularisations: Regularisation[];
  claims: Claim[];
  payrollRuns: PayrollRun[];
  gateEvents: GateEvent[];
  audit: AuditEvent[];
  notifications: NotificationItem[];
  consents: typeof CONSENTS;
  punches: Punch[];
  attendance: AttendanceDay[];
  roster: typeof ROSTER;
  contractors: typeof CONTRACTORS;
  workers: ContractWorker[];
  passes: GatePass[];
  certificates: typeof CERTS;
  courses: typeof COURSES;
  openings: typeof OPENINGS;
  candidates: Candidate[];
  goals: typeof GOALS;
  appraisals: Appraisal[];
  quarters: typeof QUARTERS;
  maintenance: typeof MAINT;
  separations: typeof SEPARATIONS;
  advances: typeof ADVANCES;
  holidays: typeof HOLIDAYS;
  shifts: typeof SHIFTS;
  leaveTypes: LeaveType[];
  tax: TaxDeclaration[];
  changes: ChangeRequest[];
  sessions: typeof SESSIONS;
  inductions: typeof INDUCTIONS;
  breaches: BreachIncident[];
  wageProofs: typeof WAGE_PROOFS;
  waiting: typeof WAITING;
  rosterPoints: typeof ROSTER_POINTS;
  sapHr: typeof SAP_HR;
  retention: typeof RETENTION;
  interfaces: NrlInterface[];
  login: (employeeId: string, role: Role) => void;
  logout: () => void;
  switchRole: (role: Role) => void;
  setLocale: (locale: "en" | "hi" | "as") => void;
  applyLeave: (input: { typeId: string; from: string; to: string; reason: string; halfDay?: "am" | "pm" }) => { ok: boolean; reason?: string; days?: number };
  decideLeave: (id: string, status: "approved" | "rejected") => void;
  withdrawLeave: (id: string) => void;
  applySwap: (input: Omit<SwapRequest, "id" | "status">) => { ok: boolean; reason?: string };
  decideSwap: (id: string, status: "approved" | "rejected") => void;
  applyRegularisation: (input: Omit<Regularisation, "id" | "status">) => void;
  decideRegularisation: (id: string, status: "approved" | "rejected") => void;
  applyClaim: (input: Omit<Claim, "id" | "status" | "submittedAt">) => { ok: boolean; reason?: string };
  decideClaim: (id: string, status: "approved" | "rejected") => void;
  withdrawClaim: (id: string) => void;
  proposeSetting: (id: string, value: number, validFrom?: string) => void;
  approveSetting: (id: string) => { ok: boolean; reason?: string };
  recordInterface: (id: NrlInterfaceId, patch: Partial<NrlInterface>) => void;
  lockAttendance: (runId: string) => void;
  computePayroll: (runId: string, opts?: { silent?: boolean }) => { ok: boolean; reason?: string };
  importSapCsv: (csv: string) => { ok: boolean; reason?: string; imported?: number; mismatches?: number };
  acceptSapAll: () => number;
  advancePayroll: (runId: string) => { ok: boolean; reason?: string };
  generateFiles: (runId: string) => StatutoryFile[];
  recordGate: (passId: string, gate: string, direction: "in" | "out") => { ok: boolean; reason?: string };
  setGateOffline: (offline: boolean) => void;
  flushGateQueue: () => void;
  clockPunch: () => { ok: boolean; kind?: Punch["kind"]; reason?: string };
  markRead: (id: string) => void;
  resetDemo: () => void;
  setHydrated: () => void;
  revealPii: (employeeId: string, field: string) => void;
  withdrawConsent: (id: string) => void;
  giveConsent: (id: string) => void;
  submitTax: (input: Omit<TaxDeclaration, "id" | "status">) => void;
  requestChange: (input: Omit<ChangeRequest, "id" | "status">) => void;
  decideChange: (id: string, status: "approved" | "rejected") => void;
  hireEmployee: (input: { name: string; cadre: Employee["cadre"]; grade: string; unitId: string; positionId: string; category: Employee["category"]; gender: Employee["gender"]; basic: number }) => { ok: boolean; id?: string; reason?: string };
  transferEmployee: (id: string, positionId: string, unitId: string, validFrom: string) => { ok: boolean; reason?: string };
  promoteEmployee: (id: string, grade: string, positionId: string, basic: number, validFrom: string) => { ok: boolean; reason?: string };
  startSeparation: (employeeId: string, kind: "resignation" | "superannuation" | "vrs" | "death", lastDay: string) => void;
  acceptSap: (empNo: string) => void;
  registerWorker: (input: Omit<ContractWorker, "id" | "blacklisted" | "inductionPassed"> & { inductionPassed?: boolean }) => void;
  bulkOnboard: (contractorId: string, count: number) => number;
  blacklistWorker: (id: string, reason: string) => { ok: boolean; reason?: string };
  uploadWageProof: (contractorId: string, month: string, fileName: string) => void;
  enrollTraining: (sessionId: string, personId: string) => void;
  sitInduction: (workerId: string, score: number) => void;
  issueCertificate: (personId: string, personKind: "employee" | "contract", courseId: string) => void;
  addOpening: (input: Omit<Opening, "id" | "status">) => void;
  moveCandidate: (id: string, stage: CandidateStage) => void;
  tickOnboarding: (id: string, item: string) => void;
  joinCandidate: (id: string) => { ok: boolean; reason?: string };
  acceptGoals: (employeeId: string) => { ok: boolean; reason?: string };
  rateAppraisal: (employeeId: string, field: "selfRating" | "reportingRating" | "reviewingRating", value: number) => { ok: boolean; reason?: string };
  closeAppraisal: (employeeId: string) => { ok: boolean; reason?: string };
  allotQuarter: (quarterId: string, employeeId: string) => { ok: boolean; reason?: string };
  raiseMaintenance: (quarterId: string, title: string) => void;
  tickMaintenance: (id: string) => void;
  tickClearance: (sepId: string, dept: string) => void;
  settleFf: (sepId: string) => void;
  addHoliday: (date: string, name: string, locationId?: Employee["locationId"]) => void;
  addLeaveType: (input: Omit<LeaveType, "id">) => void;
  editShift: (id: string, start: string, end: string) => void;
  publishRoster: (from: string, days: number) => void;
  createVacancy: (title: string, unitId: string, grade: string, cadre: Employee["cadre"]) => void;
  logBreach: (title: string) => void;
  addRetention: (object: string, reason: string, until: string) => void;
  exportReport: (name: string, content: string) => void;
  addWaiting: (employeeId: string, type: "II" | "III" | "IV" | "V") => void;
}

// August and September are already paid, so employees have payslip history before October runs.
const PAST_RUNS: PayrollRun[] = ["2026-09", "2026-08"].map((month) => {
  const { results, totals } = computeRun({
    employees: EMPLOYEES.map((e) => (PRIOR_BANK[e.id] ? { ...e, bankAccount: PRIOR_BANK[e.id] } : e)),
    month,
    onDate: `${month}-01`,
    settings: SETTINGS,
    attendance: [],
    claims: [],
    advances: ADVANCES,
    arrearsFor: () => 0,
  });
  return {
    id: `pay-${month}`,
    month,
    stage: "publish",
    startedAt: `${month}-24T10:00:00+05:30`,
    lockedAttendance: true,
    computedAt: `${month}-26T11:00:00+05:30`,
    financeApproverId: "e-rajib",
    publishedAt: `${month}-29T17:00:00+05:30`,
    results,
    totals,
  };
});

const initial = {
  currentUserId: null as string | null,
  actingRole: null as Role | null,
  locale: "en" as const,
  gateOffline: false,
  gateQueue: [] as GateEvent[],
  employees: mergeHeadcount(EMPLOYEES, EMPLOYEES),
  positions: POSITIONS.map((p) => ({ ...p })),
  settings: SETTINGS,
  leaveRequests: LEAVE_REQUESTS,
  leaveBalances: LEAVE_BALANCES,
  swaps: SWAPS,
  regularisations: REGS,
  claims: CLAIMS,
  payrollRuns: [INITIAL_RUN, ...PAST_RUNS],
  gateEvents: GATE_EVENTS,
  audit: AUDIT,
  notifications: NOTES,
  consents: CONSENTS,
  punches: PUNCHES,
  attendance: ATTENDANCE,
  roster: ROSTER,
  contractors: CONTRACTORS,
  workers: WORKERS,
  passes: PASSES,
  certificates: CERTS,
  courses: COURSES,
  openings: OPENINGS,
  candidates: CANDIDATES,
  goals: GOALS,
  appraisals: APPRAISALS,
  quarters: QUARTERS,
  maintenance: MAINT,
  separations: SEPARATIONS,
  advances: ADVANCES,
  holidays: HOLIDAYS,
  shifts: SHIFTS,
  leaveTypes: LEAVE_TYPES,
  tax: TAX,
  changes: CHANGES,
  sessions: SESSIONS,
  inductions: INDUCTIONS,
  breaches: BREACHES,
  wageProofs: WAGE_PROOFS,
  waiting: WAITING,
  rosterPoints: ROSTER_POINTS,
  sapHr: SAP_HR,
  retention: RETENTION,
  interfaces: NRL_INTERFACES.map((row) => ({ ...row })),
};

export const useHrms = create<HrmsState>()(
  persist(
    (set, get) => ({
      hydrated: false,
      ...initial,
      setHydrated: () => set({ hydrated: true }),
      login: (employeeId, role) =>
        set((s) => ({
          currentUserId: employeeId,
          actingRole: role,
          audit: log(s.audit, employeeId, "login", role, "auth"),
        })),
      logout: () => set({ currentUserId: null, actingRole: null }),
      switchRole: (role) =>
        set((s) => ({
          actingRole: role,
          audit: s.currentUserId ? log(s.audit, s.currentUserId, "switch_role", role, "auth") : s.audit,
        })),
      setLocale: (locale) => set({ locale }),
      applyLeave: (input) => {
        const s = get();
        const me = s.employees.find((e) => e.id === s.currentUserId);
        if (!me) return { ok: false, reason: "Not signed in" };
        const type = s.leaveTypes.find((t) => t.id === input.typeId);
        const days = countLeaveDays({
          from: input.from,
          to: input.to,
          locationId: me.locationId,
          employeeId: me.id,
          holidays: s.holidays,
          roster: s.roster,
          halfDay: input.halfDay,
        });
        const check = validateLeave({
          type,
          days,
          balance: s.leaveBalances.find((b) => b.employeeId === me.id && b.typeId === input.typeId),
          halfDay: input.halfDay,
          gender: me.gender,
          pendingDays: s.leaveRequests
            .filter((l) => l.employeeId === me.id && l.typeId === input.typeId && l.status === "pending")
            .reduce((n, l) => n + l.days, 0),
          overlaps: s.leaveRequests.some(
            (l) =>
              l.employeeId === me.id &&
              (l.status === "pending" || l.status === "approved") &&
              l.from <= input.to &&
              l.to >= input.from,
          ),
        });
        if (!check.ok) return check;
        const row: LeaveRequest = {
          ...input,
          id: uid("lv"),
          employeeId: me.id,
          days,
          status: "pending",
          approverId: me.managerId,
        };
        set({
          leaveRequests: [row, ...s.leaveRequests],
          audit: log(s.audit, me.id, "apply_leave", `${input.from} ${input.typeId}`, "leave", String(days)),
          notifications: notify(s.notifications, me.managerId, "Leave pending", `${me.preferredName}, ${days} day(s)`, "/approvals"),
        });
        return { ok: true, days };
      },
      decideLeave: (id, status) =>
        set((s) => {
          const actor = s.currentUserId ?? "system";
          const req = s.leaveRequests.find((l) => l.id === id);
          if (!req || req.employeeId === actor) return s;
          let balances = s.leaveBalances;
          if (status === "approved") {
            balances = balances.map((b) =>
              b.employeeId === req.employeeId && b.typeId === req.typeId
                ? { ...b, balance: Math.max(0, b.balance - req.days) }
                : b,
            );
          }
          return {
            leaveRequests: s.leaveRequests.map((l) =>
              l.id === id ? { ...l, status, approverId: actor, decidedAt: stamp() } : l,
            ),
            leaveBalances: balances,
            audit: log(s.audit, actor, "decide_leave", id, "leave", status, req.status),
            notifications: notify(s.notifications, req.employeeId, `Leave ${status}`, `${req.from} to ${req.to}`, "/leave"),
          };
        }),
      withdrawLeave: (id) =>
        set((s) => ({
          leaveRequests: s.leaveRequests.map((l) =>
            l.id === id && l.employeeId === s.currentUserId && l.status === "pending" ? { ...l, status: "withdrawn" as const } : l,
          ),
        })),
      applySwap: (input) => {
        const s = get();
        const minRest = settingOn(s.settings, "min.rest", DEMO_TODAY) || 11;
        const fromRo = s.roster.find((r) => r.employeeId === input.fromId && r.date === input.date);
        const toRo = s.roster.find((r) => r.employeeId === input.toId && r.date === input.date);
        const fromShift = s.shifts.find((x) => x.id === toRo?.shiftId);
        const prev = s.roster.find((r) => r.employeeId === input.fromId && r.date < input.date);
        const prevShift = s.shifts.find((x) => x.id === prev?.shiftId);
        const rest = restHours({ fromShift: prevShift, toShift: fromShift });
        const check = canSwap({ restHours: rest, minRest });
        if (!check.ok) return check;
        set({
          swaps: [{ ...input, id: uid("sw"), status: "pending" }, ...s.swaps],
          audit: log(s.audit, input.fromId, "apply_swap", input.date, "time"),
          notifications: notify(s.notifications, input.approverId, "Shift swap", `${input.date} rest ${rest.toFixed(1)}h`, "/approvals"),
        });
        return { ok: true };
      },
      decideSwap: (id, status) =>
        set((s) => {
          const row = s.swaps.find((x) => x.id === id);
          let roster = s.roster;
          if (status === "approved" && row) {
            const a = roster.find((r) => r.employeeId === row.fromId && r.date === row.date);
            const b = roster.find((r) => r.employeeId === row.toId && r.date === row.date);
            if (a && b) {
              roster = roster.map((r) => {
                if (r.id === a.id) return { ...r, shiftId: b.shiftId };
                if (r.id === b.id) return { ...r, shiftId: a.shiftId };
                return r;
              });
            }
          }
          return {
            swaps: s.swaps.map((x) => (x.id === id ? { ...x, status, approverId: s.currentUserId ?? undefined } : x)),
            roster,
            audit: log(s.audit, s.currentUserId ?? "system", "decide_swap", id, "time", status),
          };
        }),
      applyRegularisation: (input) =>
        set((s) => ({
          regularisations: [{ ...input, id: uid("rg"), status: "pending" }, ...s.regularisations],
          notifications: notify(s.notifications, s.employees.find((e) => e.id === input.employeeId)?.managerId, "Regularisation", input.date, "/approvals"),
        })),
      decideRegularisation: (id, status) =>
        set((s) => ({
          regularisations: s.regularisations.map((x) => (x.id === id ? { ...x, status } : x)),
          attendance:
            status === "approved"
              ? s.attendance.map((a) => {
                  const r = s.regularisations.find((x) => x.id === id);
                  if (r && a.employeeId === r.employeeId && a.date === r.date) {
                    return { ...a, status: "present" as const, hours: 8, overtime: a.overtime };
                  }
                  return a;
                })
              : s.attendance,
        })),
      applyClaim: (input) => {
        const s = get();
        const e = s.employees.find((x) => x.id === input.employeeId);
        if (!e) return { ok: false, reason: "Unknown employee" };
        const cap = claimLimit(e.grade, input.type);
        const ytd = s.claims
          .filter((c) => c.employeeId === e.id && c.type === input.type && c.status !== "rejected" && c.status !== "withdrawn")
          .reduce((n, c) => n + c.amount, 0);
        if (ytd + input.amount > cap) return { ok: false, reason: `${e.grade} ${input.type} limit is ₹${cap.toLocaleString("en-IN")} this year.` };
        set({
          claims: [{ ...input, id: uid("cl"), status: "pending", submittedAt: stamp() }, ...s.claims],
          notifications: notify(
            s.notifications,
            input.amount >= 25000 ? "e-rajib" : e.managerId,
            "Claim pending",
            `${input.type} ₹${input.amount}`,
            "/approvals",
          ),
        });
        return { ok: true };
      },
      decideClaim: (id, status) =>
        set((s) => {
          const row = s.claims.find((c) => c.id === id);
          return {
            claims: s.claims.map((c) => (c.id === id ? { ...c, status } : c)),
            notifications: row ? notify(s.notifications, row.employeeId, `Claim ${status}`, `₹${row.amount}`, "/claims") : s.notifications,
          };
        }),
      withdrawClaim: (id) =>
        set((s) => ({
          claims: s.claims.map((c) => (c.id === id && c.employeeId === s.currentUserId && c.status === "pending" ? { ...c, status: "withdrawn" as const } : c)),
        })),
      proposeSetting: (id, value, validFrom) =>
        set((s) => ({
          settings: s.settings.map((p) =>
            p.id === id ? { ...p, pendingValue: value, pendingBy: s.currentUserId ?? undefined, pendingValidFrom: validFrom ?? p.validFrom } : p,
          ),
          audit: log(s.audit, s.currentUserId ?? "system", "propose_policy", id, "policy", String(value), String(s.settings.find((p) => p.id === id)?.value)),
        })),
      approveSetting: (id) => {
        const s = get();
        const row = s.settings.find((p) => p.id === id);
        if (!row || !row.pendingBy) return { ok: false, reason: "Nothing pending" };
        if (row.pendingBy === s.currentUserId) return { ok: false, reason: "Maker cannot check their own change." };
        const closed: PolicyVersion = {
          value: row.value,
          validFrom: row.validFrom,
          validTo: row.pendingValidFrom,
          proposedBy: row.pendingBy,
          approvedBy: row.approvedBy,
          source: row.source,
        };
        set({
          settings: s.settings.map((p) =>
            p.id === id
              ? {
                  ...p,
                  previousValue: p.value,
                  value: p.pendingValue ?? p.value,
                  validFrom: p.pendingValidFrom ?? p.validFrom,
                  approvedBy: s.currentUserId ?? undefined,
                  pendingValue: undefined,
                  pendingBy: undefined,
                  pendingValidFrom: undefined,
                  versions: [closed, ...(p.versions ?? SETTINGS.find((x) => x.id === p.id)?.versions ?? [])],
                }
              : p,
          ),
          audit: log(s.audit, s.currentUserId ?? "system", "approve_policy", id, "policy", String(row.pendingValue), String(row.value)),
        });
        return { ok: true };
      },
      recordInterface: (id, patch) =>
        set((s) => ({
          interfaces: s.interfaces.map((row) => (row.id === id ? { ...row, ...patch } : row)),
        })),
      lockAttendance: (runId) =>
        set((s) => {
          const attendance = rebuildAttendance({
            roster: s.roster,
            punches: s.punches,
            holidays: s.holidays,
            shifts: s.shifts,
            leave: s.leaveRequests,
          });
          return {
            attendance,
            payrollRuns: s.payrollRuns.map((r) => (r.id === runId ? { ...r, lockedAttendance: true } : r)),
            audit: log(s.audit, s.currentUserId ?? "system", "attendance_lock", runId, "payroll"),
          };
        }),
      computePayroll: (runId, opts) => {
        const s = get();
        const run = s.payrollRuns.find((r) => r.id === runId);
        if (!run) return { ok: false, reason: "Run not found" };
        if (!opts?.silent && !run.lockedAttendance) {
          return { ok: false, reason: "Lock attendance before compute." };
        }
        const { results, totals } = computeRun({
          employees: s.employees,
          month: run.month,
          onDate: `${run.month}-01`,
          settings: s.settings,
          attendance: s.attendance,
          claims: s.claims,
          advances: s.advances,
          arrearsFor: (e) => arrearsFor(e, s.settings, run.month),
        });
        set({
          payrollRuns: s.payrollRuns.map((r) =>
            r.id === runId
              ? {
                  ...r,
                  results,
                  totals,
                  computedAt: r.computedAt ?? stamp(),
                  stage: opts?.silent ? r.stage : ("validate" as const),
                }
              : r,
          ),
          audit: opts?.silent ? s.audit : log(s.audit, s.currentUserId ?? "system", "compute_payroll", runId, "payroll"),
        });
        return { ok: true };
      },
      advancePayroll: (runId) => {
        const s = get();
        const run = s.payrollRuns.find((r) => r.id === runId);
        if (!run) return { ok: false, reason: "Run not found" };
        if (s.actingRole === "auditor") return { ok: false, reason: "Auditor is read-only." };
        const idx = STAGES.indexOf(run.stage);
        const next = STAGES[idx + 1];
        if (!next) return { ok: false, reason: "Already published" };
        if (!canAdvancePayroll(s.actingRole, run.stage)) {
          return { ok: false, reason: run.stage === "finance_approval" ? "Finance must approve. Payroll cannot self-release." : "You cannot move this stage." };
        }
        if (next === "inputs" && !run.lockedAttendance) {
          get().lockAttendance(runId);
          return { ok: true };
        }
        if (run.stage === "inputs" && next === "compute") {
          if (!run.lockedAttendance) return { ok: false, reason: "Lock attendance before compute." };
          const r = get().computePayroll(runId);
          return r.ok ? { ok: true } : r;
        }
        if (next === "finance_approval" || run.stage === "validate") {
          const hard = run.results.filter((r) => r.flags.some((f) => f.severity === "block"));
          if (hard.length && next === "finance_approval") {
            return { ok: false, reason: `${hard.length} employees fail DPE / wage-share / bank checks.` };
          }
        }
        if (run.stage === "finance_approval" && next === "bank_file") {
          if (s.actingRole !== "finance_approver") return { ok: false, reason: "Finance must approve. Payroll cannot self-release." };
        }
        let files = run.files;
        if (next === "publish" || next === "bank_file") {
          files = getFiles(get(), runId);
        }
        set({
          payrollRuns: get().payrollRuns.map((r) =>
            r.id === runId
              ? {
                  ...r,
                  stage: next,
                  files,
                  financeApproverId: next === "bank_file" ? s.currentUserId ?? undefined : r.financeApproverId,
                  publishedAt: next === "publish" ? stamp() : r.publishedAt,
                }
              : r,
          ),
          audit: log(get().audit, s.currentUserId ?? "system", "advance_payroll", `${runId}:${next}`, "payroll"),
        });
        return { ok: true };
      },
      generateFiles: (runId) => {
        const s0 = get();
        const run0 = s0.payrollRuns.find((r) => r.id === runId);
        if (!run0 || (run0.stage !== "bank_file" && run0.stage !== "publish")) return [];
        if (s0.actingRole !== "payroll_officer" && s0.actingRole !== "finance_approver") return [];
        const files = getFiles(s0, runId);
        const at = stamp();
        const bank = files.find((f) => f.kind === "bank");
        const ecr = files.find((f) => f.kind === "ecr");
        const tds = files.find((f) => f.kind === "tds24q");
        set((s) => ({
          payrollRuns: s.payrollRuns.map((r) => (r.id === runId ? { ...r, files } : r)),
          interfaces: s.interfaces.map((row) => {
            if (row.id === "sbi" && bank) {
              return { ...row, lastFile: bank.name, lastRun: at, lastAck: undefined, status: "awaiting_ack" as const };
            }
            if (row.id === "epfo" && ecr) {
              return { ...row, lastFile: ecr.name, lastRun: at, status: "file_ready" as const };
            }
            if (row.id === "traces" && tds) {
              return { ...row, lastFile: tds.name, lastRun: at, status: "file_ready" as const };
            }
            return row;
          }),
          audit: log(s.audit, s.currentUserId ?? "system", "export_statutory", runId, "payroll"),
        }));
        return files;
      },
      recordGate: (passId, gate, direction) => {
        const s = get();
        if (s.actingRole !== "gate_security") return { ok: false, reason: "Only gate security records entry and exit." };
        const pass = s.passes.find((p) => p.id === passId);
        if (!pass) return { ok: false, reason: "Pass not found" };
        const worker = s.workers.find((w) => w.id === pass.workerId);
        const contractor = s.contractors.find((c) => c.id === worker?.contractorId);
        const reason = worker ? passBlockReason({ worker, contractor, certs: s.certificates }) : "Unknown worker";
        if (reason) return { ok: false, reason };
        if (pass.validTo < DEMO_TODAY) return { ok: false, reason: "Pass expired" };
        const event: GateEvent = { id: uid("ge"), passId, gate, direction, time: stamp() };
        if (s.gateOffline) {
          set({ gateQueue: [event, ...s.gateQueue] });
          return { ok: true };
        }
        set({ gateEvents: [event, ...s.gateEvents] });
        return { ok: true };
      },
      setGateOffline: (offline) => set({ gateOffline: offline }),
      flushGateQueue: () =>
        set((s) => ({
          gateEvents: [...s.gateQueue, ...s.gateEvents],
          gateQueue: [],
          gateOffline: false,
          audit: log(s.audit, s.currentUserId ?? "system", "sync_gate", `${s.gateQueue.length} events`, "gate"),
        })),
      clockPunch: () => {
        const s = get();
        const id = s.currentUserId;
        if (!id) return { ok: false, reason: "Not signed in" };
        const { inn, out, inside } = openPair(punchesOn(s.punches, id));
        if (inn && out && !inside) return { ok: false, reason: "Day already closed. Regularise if you need another pair." };
        const kind: Punch["kind"] = inside ? "out" : "in";
        const now = new Date();
        const hh = String(now.getHours()).padStart(2, "0");
        const mm = String(now.getMinutes()).padStart(2, "0");
        const ss = String(now.getSeconds()).padStart(2, "0");
        const punch: Punch = {
          id: uid("p"),
          employeeId: id,
          readerId: "WEB-ESS",
          time: `${DEMO_TODAY}T${hh}:${mm}:${ss}+05:30`,
          kind,
        };
        set({
          punches: [...s.punches, punch],
          audit: log(s.audit, id, kind === "in" ? "check_in" : "check_out", punch.readerId, "ess"),
        });
        return { ok: true, kind };
      },
      markRead: (id) => set((s) => ({ notifications: s.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)) })),
      resetDemo: () => set({ ...initial, hydrated: true, currentUserId: get().currentUserId, actingRole: get().actingRole }),
      revealPii: (employeeId, field) =>
        set((s) => ({
          audit: log(s.audit, s.currentUserId ?? "system", "reveal_pii", `${employeeId}:${field}`, "privacy"),
        })),
      withdrawConsent: (id) =>
        set((s) => ({
          consents: s.consents.map((c) => (c.id === id ? { ...c, given: false, withdrawnAt: stamp() } : c)),
          audit: log(s.audit, s.currentUserId ?? "system", "withdraw_consent", id, "privacy"),
        })),
      giveConsent: (id) =>
        set((s) => ({
          consents: s.consents.map((c) => (c.id === id ? { ...c, given: true, at: stamp(), withdrawnAt: undefined } : c)),
        })),
      submitTax: (input) =>
        set((s) => ({
          tax: [{ ...input, id: uid("tx"), status: "pending" }, ...s.tax.filter((t) => !(t.employeeId === input.employeeId && t.fy === input.fy))],
          notifications: notify(s.notifications, "e-pranjal", "Tax declaration", input.fy, "/tax"),
        })),
      requestChange: (input) =>
        set((s) => ({
          changes: [{ ...input, id: uid("ch"), status: "pending" }, ...s.changes],
          notifications: notify(s.notifications, "e-bhaskar", "Detail change", `${input.field} → ${input.to}`, "/approvals"),
        })),
      decideChange: (id, status) =>
        set((s) => {
          const row = s.changes.find((c) => c.id === id);
          if (!row || row.status !== "pending") return {};
          if (row.makerId && row.makerId === s.currentUserId) return {};
          if (row.employeeId === s.currentUserId) return {};
          let employees = s.employees;
          if (status === "approved" && row.promotion) {
            const p = row.promotion;
            employees = employees.map((e) => {
              if (e.id !== row.employeeId) return e;
              const current = p.validFrom <= DEMO_TODAY;
              const prev = e.assignmentHistory.map((a) =>
                a.validTo ? a : { ...a, basic: a.basic ?? e.basic, validTo: p.validFrom },
              );
              return {
                ...e,
                ...(current ? { grade: p.grade, positionId: p.positionId, basic: p.basic } : {}),
                assignmentHistory: [
                  {
                    positionId: p.positionId,
                    unitId: e.unitId,
                    locationId: e.locationId,
                    grade: p.grade,
                    cadre: e.cadre,
                    crew: e.crew,
                    basic: p.basic,
                    validFrom: p.validFrom,
                  },
                  ...prev,
                ],
              };
            });
          } else if (status === "approved") {
            employees = employees.map((e) => {
              if (e.id !== row.employeeId) return e;
              if (row.field === "phone") return { ...e, phone: row.to };
              if (row.field === "email") return { ...e, email: row.to };
              if (row.field === "address") return { ...e, address: row.to };
              if (row.field === "bank") {
                const [ifsc, account] = row.to.split(" ");
                return { ...e, ifsc: ifsc || e.ifsc, bankAccount: account || e.bankAccount };
              }
              return e;
            });
          }
          return {
            changes: s.changes.map((c) => (c.id === id ? { ...c, status } : c)),
            employees,
            audit: log(s.audit, s.currentUserId ?? "system", "decide_change", id, "hr", status, row?.from),
          };
        }),
      hireEmployee: (input) => {
        const s = get();
        const pos = s.positions.find((p) => p.id === input.positionId);
        if (pos && !pos.vacant && s.employees.some((e) => e.positionId === pos.id && e.status !== "separated")) {
          return { ok: false, reason: "Position is occupied." };
        }
        const id = uid("e");
        const emp: Employee = {
          id,
          empNo: `NRL/${input.cadre[0].toUpperCase()}/2026/${String(s.employees.length + 1).padStart(3, "0")}`,
          name: input.name,
          preferredName: input.name.split(" ")[0],
          gender: input.gender,
          dob: "1995-01-01",
          doj: DEMO_TODAY,
          email: `${input.name.toLowerCase().replace(/\s+/g, ".")}@nrl.co.in`,
          phone: "+91 90000 00000",
          category: input.category,
          pwbd: false,
          cadre: input.cadre,
          grade: input.grade,
          basic: input.basic,
          cafeteriaPct: 20,
          hardshipAllowance: 0,
          locationId: "numaligarh",
          unitId: input.unitId,
          positionId: input.positionId,
          status: "probation",
          bankAccount: "0000000000",
          ifsc: "SBIN0003180",
          pan: "XXXXX0000X",
          aadhaar: "000000000000",
          assignmentHistory: [
            {
              positionId: input.positionId,
              unitId: input.unitId,
              locationId: "numaligarh",
              grade: input.grade,
              cadre: input.cadre,
              validFrom: DEMO_TODAY,
            },
          ],
          family: [],
          nominations: [],
          roles: ["employee"],
        };
        set({
          employees: [emp, ...s.employees],
          positions: s.positions.map((p) => (p.id === input.positionId ? { ...p, vacant: false } : p)),
          leaveBalances: [
            { employeeId: id, typeId: "el", balance: 8 },
            { employeeId: id, typeId: "cl", balance: 6 },
            { employeeId: id, typeId: "hpl", balance: 0 },
            { employeeId: id, typeId: "rh", balance: 1 },
            ...s.leaveBalances,
          ],
          audit: log(s.audit, s.currentUserId ?? "system", "hire", id, "hr", input.name),
        });
        return { ok: true, id };
      },
      transferEmployee: (id, positionId, unitId, validFrom) => {
        if (id === get().currentUserId) return { ok: false, reason: "You cannot change your own assignment." };
        set((s) => ({
          employees: s.employees.map((e) =>
            e.id === id
              ? {
                  ...e,
                  positionId,
                  unitId,
                  assignmentHistory: [
                    {
                      positionId,
                      unitId,
                      locationId: e.locationId,
                      grade: e.grade,
                      cadre: e.cadre,
                      crew: e.crew,
                      validFrom,
                    },
                    ...e.assignmentHistory.map((a) => (a.validTo ? a : { ...a, validTo: validFrom })),
                  ],
                }
              : e,
          ),
          positions: s.positions.map((p) => (p.id === positionId ? { ...p, vacant: false } : p)),
          audit: log(s.audit, s.currentUserId ?? "system", "transfer", id, "hr", `${positionId} from ${validFrom}`),
        }));
        return { ok: true };
      },
      promoteEmployee: (id, grade, positionId, basic, validFrom) => {
        const s = get();
        if (id === s.currentUserId) return { ok: false, reason: "You cannot change your own pay record." };
        if (s.actingRole !== "hr_admin") return { ok: false, reason: "Only HR can propose a promotion." };
        const e = s.employees.find((x) => x.id === id);
        if (!e) return { ok: false, reason: "Employee not found" };
        if (s.changes.some((c) => c.employeeId === id && c.field === "promotion" && c.status === "pending")) {
          return { ok: false, reason: "A promotion is already waiting for a checker." };
        }
        set({
          changes: [
            {
              id: uid("ch"),
              employeeId: id,
              field: "promotion",
              from: `${e.grade} · ₹${e.basic.toLocaleString("en-IN")}`,
              to: `${grade} · ₹${basic.toLocaleString("en-IN")} from ${validFrom}`,
              status: "pending",
              makerId: s.currentUserId ?? undefined,
              promotion: { grade, positionId, basic, validFrom },
            },
            ...s.changes,
          ],
          audit: log(s.audit, s.currentUserId ?? "system", "propose_promotion", id, "hr", grade, e.grade),
        });
        return { ok: true };
      },
      startSeparation: (employeeId, kind, lastDay) =>
        set((s) => ({
          employees: s.employees.map((e) => (e.id === employeeId ? { ...e, status: "notice" as const } : e)),
          separations: [
            {
              id: uid("sp"),
              employeeId,
              kind,
              lastDay,
              status: "initiated",
              clearances: [
                { dept: "Township", done: false },
                { dept: "Finance (advances)", done: false },
                { dept: "IT assets", done: false },
                { dept: "Library", done: false },
                { dept: "HSE", done: false },
              ],
            },
            ...s.separations,
          ],
          audit: log(s.audit, s.currentUserId ?? "system", "separate", employeeId, "hr", kind),
        })),
      acceptSap: (empNo) =>
        set((s) => {
          const sap = s.sapHr.find((r) => r.empNo === empNo);
          if (!sap) return s;
          return {
            employees: s.employees.map((e) =>
              e.empNo === empNo ? { ...e, grade: sap.grade, basic: sap.basic, unitId: sap.unitId || e.unitId } : e,
            ),
            audit: log(s.audit, s.currentUserId ?? "system", "accept_sap", empNo, "hr", sap.grade),
          };
        }),
      importSapCsv: (csv) => {
        const parsed = parseSapCsv(csv);
        if (!parsed.ok) return parsed;
        const byEmp = new Map(parsed.rows.map((r) => [r.empNo, r]));
        set((s) => {
          const kept = s.sapHr.filter((r) => !byEmp.has(r.empNo));
          const sapHr = [...kept, ...parsed.rows];
          return {
            sapHr,
            interfaces: s.interfaces.map((row) =>
              row.id === "sap_hr"
                ? { ...row, lastFile: "SAP_HR_IMPORT.csv", lastRun: stamp(), status: "file_ready" as const }
                : row,
            ),
            audit: log(s.audit, s.currentUserId ?? "system", "import_sap_csv", `${parsed.rows.length} rows`, "hr"),
          };
        });
        const mismatches = sapMismatch(get().employees, get().sapHr).length;
        return { ok: true, imported: parsed.rows.length, mismatches };
      },
      acceptSapAll: () => {
        const s = get();
        const hits = sapMismatch(s.employees, s.sapHr).filter((m) => m.e);
        const byEmp = new Map(s.sapHr.map((r) => [r.empNo, r]));
        set({
          employees: s.employees.map((e) => {
            const sap = byEmp.get(e.empNo);
            if (!sap) return e;
            return { ...e, grade: sap.grade, basic: sap.basic, unitId: sap.unitId || e.unitId };
          }),
          audit: log(s.audit, s.currentUserId ?? "system", "accept_sap_all", String(hits.length), "hr"),
        });
        return hits.length;
      },
      registerWorker: (input) =>
        set((s) => {
          const workers = [{ ...input, id: uid("w"), blacklisted: false, inductionPassed: input.inductionPassed ?? false }, ...s.workers];
          return {
            workers,
            passes: syncPasses(workers, s.contractors, s.certificates, s.passes),
            audit: log(s.audit, s.currentUserId ?? "system", "register_worker", input.name, "clm"),
          };
        }),
      bulkOnboard: (contractorId, count) => {
        const s = get();
        if (s.actingRole !== "contract_labour_cell") return 0;
        const skills = ["Rigger", "Welder-6G", "Helper", "Fitter", "Scaffolder", "Grinder"];
        const added: ContractWorker[] = Array.from({ length: count }, (_, i) => ({
          id: uid("w"),
          contractorId,
          name: `Shutdown ${String(s.workers.length + i + 1).padStart(3, "0")}`,
          skill: skills[i % skills.length],
          aadhaar: `${100000000000 + s.workers.length + i}`,
          uan: `${101000000000 + s.workers.length + i}`,
          esic: `${2211000000 + i}`,
          policeVerification: false,
          medicalFitnessExpiry: "2027-03-31",
          photoSeed: `Shut${i}`,
          blacklisted: false,
          inductionPassed: false,
        }));
        const workers = [...added, ...s.workers];
        // Bulk registration only opens the record; police verification and induction still gate the pass.
        const certificates = s.certificates;
        set({
          workers,
          certificates,
          passes: syncPasses(workers, s.contractors, certificates, s.passes),
          audit: log(s.audit, s.currentUserId ?? "system", "bulk_onboard", contractorId, "clm", String(count)),
        });
        return added.length;
      },
      blacklistWorker: (id, reason) => {
        const s = get();
        if (s.actingRole !== "contract_labour_cell" && s.actingRole !== "hr_admin") {
          return { ok: false, reason: "Needs contract labour cell approval." };
        }
        const workers = s.workers.map((w) => (w.id === id ? { ...w, blacklisted: true } : w));
        set({
          workers,
          passes: syncPasses(workers, s.contractors, s.certificates, s.passes),
          audit: log(s.audit, s.currentUserId ?? "system", "blacklist", id, "clm", reason),
        });
        return { ok: true };
      },
      uploadWageProof: (contractorId, month, fileName) =>
        set((s) => ({
          wageProofs: [{ id: uid("wp"), contractorId, month, fileName, at: stamp() }, ...s.wageProofs],
          audit: log(s.audit, s.currentUserId ?? "system", "wage_proof", contractorId, "clm", fileName),
        })),
      enrollTraining: (sessionId, personId) =>
        set((s) => ({
          sessions: s.sessions.map((t) =>
            t.id === sessionId && t.enrolled.length < t.seats && !t.enrolled.includes(personId)
              ? { ...t, enrolled: [...t.enrolled, personId] }
              : t,
          ),
        })),
      sitInduction: (workerId, score) =>
        set((s) => {
          const passed = score >= 70;
          const workers = s.workers.map((w) => (w.id === workerId ? { ...w, inductionPassed: passed } : w));
          return {
            inductions: [{ id: uid("in"), workerId, score, passed, at: stamp() }, ...s.inductions],
            workers,
            passes: syncPasses(workers, s.contractors, s.certificates, s.passes),
          };
        }),
      issueCertificate: (personId, personKind, courseId) =>
        set((s) => {
          const course = s.courses.find((c) => c.id === courseId);
          const issued = DEMO_TODAY;
          const exp = new Date(Date.parse(`${issued}T00:00:00`));
          exp.setMonth(exp.getMonth() + (course?.validityMonths ?? 12));
          const certificates = [
            { id: uid("ct"), personId, personKind, courseId, issued, expires: exp.toISOString().slice(0, 10) },
            ...s.certificates,
          ];
          return {
            certificates,
            passes: syncPasses(s.workers, s.contractors, certificates, s.passes),
          };
        }),
      addOpening: (input) =>
        set((s) => ({
          openings: [{ ...input, id: uid("op"), status: "open" }, ...s.openings],
          audit: log(s.audit, s.currentUserId ?? "system", "add_opening", input.post, "rec"),
        })),
      moveCandidate: (id, stage) =>
        set((s) => ({
          candidates: s.candidates.map((c) => (c.id === id ? { ...c, stage } : c)),
          audit: log(s.audit, s.currentUserId ?? "system", "move_candidate", id, "rec", stage),
        })),
      tickOnboarding: (id, item) =>
        set((s) => ({
          candidates: s.candidates.map((c) =>
            c.id === id
              ? { ...c, checklist: c.checklist.map((x) => (x.item === item ? { ...x, done: true } : x)) }
              : c,
          ),
          audit: log(s.audit, s.currentUserId ?? "system", "onboarding", `${id}:${item}`, "rec"),
        })),
      joinCandidate: (id) => {
        const s = get();
        const c = s.candidates.find((x) => x.id === id);
        if (!c) return { ok: false, reason: "Not found" };
        if (c.checklist.some((x) => !x.done)) return { ok: false, reason: "Onboarding checklist is open." };
        const opening = s.openings.find((o) => o.id === c.openingId);
        const vacant = s.positions.find((p) => p.vacant && p.grade === opening?.grade) ?? s.positions.find((p) => p.vacant);
        if (!vacant) return { ok: false, reason: "No vacant post." };
        const hired = get().hireEmployee({
          name: c.name,
          cadre: opening?.cadre ?? "executive",
          grade: opening?.grade ?? "E2",
          unitId: vacant.unitId,
          positionId: vacant.id,
          category: c.category,
          gender: "O",
          basic: opening?.cadre === "workman" ? 28600 : 58600,
        });
        if (!hired.ok) return hired;
        set((st) => ({
          candidates: st.candidates.map((x) => (x.id === id ? { ...x, stage: "joined" as const, employeeId: hired.id } : x)),
          openings: st.openings.map((o) => (o.id === c.openingId ? { ...o, vacancies: Math.max(0, o.vacancies - 1) } : o)),
          rosterPoints: st.rosterPoints.map((p) =>
            p.openingId === c.openingId && p.category === c.category ? { ...p, nextPoint: p.nextPoint + 1 } : p,
          ),
          audit: log(st.audit, st.currentUserId ?? "system", "join_candidate", id, "rec", hired.id),
        }));
        return { ok: true };
      },
      acceptGoals: (employeeId) => {
        const s = get();
        const a = s.appraisals.find((x) => x.employeeId === employeeId);
        if (!a) return { ok: false, reason: "No appraisal this cycle." };
        if (a.stage !== "goal_setting" && a.stage !== "mid_year") {
          return { ok: false, reason: "Goals are already accepted." };
        }
        set({
          appraisals: s.appraisals.map((x) =>
            x.employeeId === employeeId ? { ...x, stage: "self" as const } : x,
          ),
          audit: log(s.audit, s.currentUserId ?? "system", "accept_goals", employeeId, "apar"),
        });
        return { ok: true };
      },
      rateAppraisal: (employeeId, field, value) => {
        const n = Math.round(Number(value));
        if (n < 1 || n > 5) return { ok: false, reason: "Choose a rating from 1 to 5." };
        const s = get();
        const a = s.appraisals.find((x) => x.employeeId === employeeId);
        if (!a) return { ok: false, reason: "No appraisal this cycle." };
        if (field === "selfRating" && a.stage !== "self") return { ok: false, reason: "Self-appraisal is not open." };
        if (field === "reportingRating" && a.stage !== "reporting") return { ok: false, reason: "Reporting officer rating is not open." };
        if (field === "reviewingRating" && a.stage !== "reviewing") return { ok: false, reason: "Reviewing officer rating is not open." };
        const next = field === "selfRating" ? "reporting" : field === "reportingRating" ? "reviewing" : a.stage;
        set({
          appraisals: s.appraisals.map((x) =>
            x.employeeId === employeeId ? { ...x, [field]: n, stage: next } : x,
          ),
          audit: log(s.audit, s.currentUserId ?? "system", "rate_appraisal", employeeId, "apar", `${field}:${n}`),
        });
        return { ok: true };
      },
      closeAppraisal: (employeeId) => {
        const s = get();
        const a = s.appraisals.find((x) => x.employeeId === employeeId);
        if (!a) return { ok: false, reason: "No appraisal this cycle." };
        if (a.stage !== "reviewing" || !a.reviewingRating) {
          return { ok: false, reason: "Reviewing officer must rate before close." };
        }
        const mou = settingOn(s.settings, "prp.mou", DEMO_TODAY) || 91;
        const e = s.employees.find((x) => x.id === employeeId);
        const finalRating = a.reviewingRating;
        const prpAmount = Math.round((e?.basic ?? 0) * 0.4 * (finalRating / 5) * (mou / 100));
        set({
          appraisals: s.appraisals.map((x) =>
            x.employeeId === employeeId ? { ...x, stage: "closed" as const, finalRating, prpAmount } : x,
          ),
          audit: log(s.audit, s.currentUserId ?? "system", "close_appraisal", employeeId, "apar", String(finalRating)),
        });
        return { ok: true };
      },
      allotQuarter: (quarterId, employeeId) => {
        const s = get();
        const q = s.quarters.find((x) => x.id === quarterId);
        if (!q || q.status !== "vacant") return { ok: false, reason: "Quarter is not vacant." };
        set({
          quarters: s.quarters.map((x) => (x.id === quarterId ? { ...x, status: "occupied" as const, employeeId } : x)),
          employees: s.employees.map((e) => (e.id === employeeId ? { ...e, quarterId } : e)),
          waiting: s.waiting.filter((w) => w.employeeId !== employeeId),
          audit: log(s.audit, s.currentUserId ?? "system", "allot_quarter", quarterId, "twn", employeeId),
        });
        return { ok: true };
      },
      raiseMaintenance: (quarterId, title) =>
        set((s) => ({
          maintenance: [{ id: uid("mn"), quarterId, title, status: "open", raisedAt: stamp() }, ...s.maintenance],
        })),
      tickMaintenance: (id) =>
        set((s) => ({
          maintenance: s.maintenance.map((m) =>
            m.id === id ? { ...m, status: m.status === "open" ? "in_progress" : "closed" } : m,
          ),
        })),
      tickClearance: (sepId, dept) =>
        set((s) => {
          const sep = s.separations.find((x) => x.id === sepId);
          if (s.actingRole !== "hr_admin" || !sep || sep.employeeId === s.currentUserId) return {};
          return {
          separations: s.separations.map((sp) =>
            sp.id === sepId
              ? {
                  ...sp,
                  status: "clearance" as const,
                  clearances: sp.clearances.map((c) =>
                    c.dept === dept && !c.done
                      ? { ...c, done: true, byId: s.currentUserId ?? undefined, at: stamp() }
                      : c,
                  ),
                }
              : sp,
          ),
          audit: log(s.audit, s.currentUserId ?? "system", "clearance", `${sepId}:${dept}`, "sep"),
          };
        }),
      settleFf: (sepId) =>
        set((s) => {
          const sp = s.separations.find((x) => x.id === sepId);
          if (!sp || s.actingRole !== "hr_admin" || sp.employeeId === s.currentUserId) return s;
          const e = s.employees.find((x) => x.id === sp.employeeId);
          if (!e) return s;
          const ff = computeFf({
            employee: e,
            lastDay: sp.lastDay,
            settings: s.settings,
            elBalance: s.leaveBalances.find((b) => b.employeeId === e.id && b.typeId === "el"),
            advances: s.advances,
          });
          return {
            separations: s.separations.map((x) =>
              x.id === sepId ? { ...x, status: "settled" as const, ...ff } : x,
            ),
            employees: s.employees.map((x) => (x.id === e.id ? { ...x, status: "separated" as const, quarterId: undefined } : x)),
            audit: log(s.audit, s.currentUserId ?? "system", "settle_ff", sepId, "payroll", String(ff.netFf)),
          };
        }),
      addHoliday: (date, name, locationId) =>
        set((s) => ({ holidays: [...s.holidays, { date, name, locationId }] })),
      addLeaveType: (input) =>
        set((s) => ({ leaveTypes: [...s.leaveTypes, { ...input, id: input.code.toLowerCase() }] })),
      editShift: (id, start, end) =>
        set((s) => ({ shifts: s.shifts.map((x) => (x.id === id ? { ...x, start, end } : x)) })),
      publishRoster: (from, days) =>
        set((s) => {
          const extra = generateRoster(s.employees, from, days);
          const keep = s.roster.filter((r) => !extra.some((x) => x.employeeId === r.employeeId && x.date === r.date));
          return { roster: [...keep, ...extra], audit: log(s.audit, s.currentUserId ?? "system", "publish_roster", from, "time", String(days)) };
        }),
      createVacancy: (title, unitId, grade, cadre) =>
        set((s) => ({
          positions: [...s.positions, { id: uid("p"), title, unitId, grade, cadre, vacant: true }],
        })),
      logBreach: (title) =>
        set((s) => s.actingRole !== "hr_admin" ? {} : ({
          breaches: [{ id: uid("br"), title, at: stamp(), notified: true }, ...s.breaches],
          audit: log(s.audit, s.currentUserId ?? "system", "breach", title, "privacy"),
        })),
      addRetention: (object, reason, until) =>
        set((s) => s.actingRole !== "hr_admin" ? {} : ({ retention: [{ id: uid("rt"), object, reason, until }, ...s.retention] })),
      exportReport: (name, content) => {
        set((s) => ({ audit: log(s.audit, s.currentUserId ?? "system", "export_report", name, "gov") }));
        void content;
      },
      addWaiting: (employeeId, type) =>
        set((s) => ({
          waiting: [{ id: uid("wl"), employeeId, type, applied: DEMO_TODAY }, ...s.waiting],
        })),
    }),
    {
      name: "nrl-people",
      version: 9,
      migrate: () => ({ ...initial }),
      partialize: (s) => {
        const slice = { ...initial };
        for (const k of Object.keys(initial) as (keyof typeof initial)[]) slice[k] = s[k] as never;
        slice.employees = s.employees.filter((e) => !e.id.startsWith("g-"));
        slice.payrollRuns = s.payrollRuns.map((r) => ({
          ...r,
          results: r.results.filter((x) => !x.employeeId.startsWith("g-")),
          files: undefined,
        }));
        return slice;
      },
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Partial<typeof initial> & { employees?: Employee[]; payrollRuns?: PayrollRun[] };
        const core = (p.employees ?? current.employees).filter((e) => !e.id.startsWith("g-"));
        return {
          ...current,
          ...p,
          employees: mergeHeadcount(core, EMPLOYEES),
          positions: current.positions,
          claims: (() => {
            const have = new Set((p.claims ?? current.claims).map((c) => c.id));
            return [...(p.claims ?? current.claims), ...CLAIMS.filter((c) => !have.has(c.id))];
          })(),
          interfaces: (p.interfaces ?? current.interfaces).map((row) => {
            const cat = NRL_INTERFACES.find((x) => x.id === row.id);
            return cat
              ? {
                  ...row,
                  name: cat.name,
                  system: cat.system,
                  purpose: cat.purpose,
                  channel: cat.channel,
                  note: cat.note,
                }
              : row;
          }),
          settings: (p.settings ?? current.settings).map((row) => ({
            ...row,
            versions: row.versions ?? SETTINGS.find((x) => x.id === row.id)?.versions,
          })),
        };
      },
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        queueMicrotask(() => {
          const s = useHrms.getState();
          useHrms.setState({
            employees: mergeHeadcount(
              s.employees.filter((e) => !e.id.startsWith("g-")),
              EMPLOYEES,
            ),
          });
          for (const r of useHrms.getState().payrollRuns) {
            if (r.computedAt) useHrms.getState().computePayroll(r.id, { silent: true });
          }
          useHrms.getState().setHydrated();
        });
      },
    },
  ),
);

function getFiles(s: { payrollRuns: PayrollRun[]; employees: Employee[]; claims: Claim[] }, runId: string): StatutoryFile[] {
  const run = s.payrollRuns.find((r) => r.id === runId);
  if (!run) return [];
  const people = new Map(s.employees.map((e) => [e.id, e]));
  const claims = s.claims.flatMap((c) => {
    if (c.status !== "approved") return [];
    const e = people.get(c.employeeId);
    if (!e) return [];
    return [{ empNo: e.empNo, name: e.name, account: e.bankAccount, ifsc: e.ifsc, amount: c.amount }];
  });
  return [
    bankFile(run.month, run.results, s.employees),
    ecrFile(run.month, run.results, s.employees),
    npsFile(run.month, run.results, s.employees),
    form24q(run.month, run.results, s.employees),
    ...ptFiles(run.month, run.results, s.employees),
    sapFiFile(run.month, run.results),
    claimsBankFile(run.month, claims),
  ];
}

export function useCurrentUser() {
  return useHrms((s) => s.employees.find((e) => e.id === s.currentUserId) ?? null);
}

void CANDIDATE_FLOW;
void SAP_NET;

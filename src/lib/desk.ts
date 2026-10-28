"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

/* Workflows the role review found missing: cases, visitors, permits, muster, interviews.
   Kept apart from the main store so each desk can grow without touching payroll state. */

export type CaseKind = "helpdesk" | "grievance" | "discipline" | "transfer" | "medical";
export type CaseStatus = "open" | "in_progress" | "resolved";

export interface CaseItem {
  id: string;
  kind: CaseKind;
  raisedBy: string;
  // For discipline: the employee the case is about, when someone else raised it.
  aboutId?: string;
  subject: string;
  detail: string;
  status: CaseStatus;
  at: string;
  confidential: boolean;
  updates: { at: string; by: string; text: string }[];
}

export interface Visitor {
  id: string;
  name: string;
  org: string;
  hostId: string;
  purpose: string;
  gate: string;
  idLast4: string;
  status: "expected" | "inside" | "left";
  inAt?: string;
  outAt?: string;
}

export interface Vehicle {
  id: string;
  reg: string;
  kind: "tanker" | "material" | "staff bus";
  material: string;
  gate: string;
  challan: string;
  status: "inside" | "left";
  inAt: string;
  outAt?: string;
}

export interface Handover {
  id: string;
  gate: string;
  by: string;
  shift: "M" | "A" | "N";
  at: string;
  note: string;
}

export interface Permit {
  id: string;
  kind: "hot work" | "cold work" | "height" | "confined space";
  area: string;
  issuerId: string;
  workerIds: string[];
  courseId: string;
  from: string;
  to: string;
  status: "active" | "suspended" | "closed";
}

export interface Incident {
  id: string;
  kind: "incident" | "near miss" | "unsafe act";
  area: string;
  at: string;
  reportedBy: string;
  severity: 1 | 2 | 3;
  detail: string;
  status: "open" | "closed";
  action?: string;
}

export interface Muster {
  id: string;
  contractorId: string;
  date: string;
  workerIds: string[];
  submittedBy: string;
  status: "submitted" | "verified" | "disputed";
  note?: string;
}

export interface WorkerRequest {
  id: string;
  contractorId: string;
  name: string;
  trade: string;
  requestedBy: string;
  status: "pending" | "approved" | "rejected";
  at: string;
}

export interface Challan {
  id: string;
  contractorId: string;
  month: string;
  kind: "EPF" | "ESI";
  paid: number;
  due: number;
  status: "pending" | "verified" | "short";
}

export interface Interview {
  id: string;
  candidateId: string;
  at: string;
  panel: string[];
  scores: Record<string, number>;
  docs: Record<string, boolean>;
  offerAt?: string;
  callLetterAt?: string;
}

export interface OvertimeRequest {
  id: string;
  employeeId: string;
  date: string;
  hours: number;
  reason: string;
  status: "pending" | "approved" | "rejected";
  by?: string;
}

export interface ShiftHandover {
  id: string;
  unitId: string;
  shift: "M" | "A" | "N";
  by: string;
  at: string;
  note: string;
}

export interface BankAck {
  runId: string;
  at: string;
  by: string;
  credited: number;
  rejected: { account: string; reason: string }[];
}

// What each contractor pays per day by skill, from the wage sheet attached to the bill.
export interface WageRow {
  id: string;
  contractorId: string;
  skill: "Unskilled" | "Semi-skilled" | "Skilled" | "Highly skilled";
  workers: number;
  paidDaily: number;
  noticeAt?: string;
}

export interface TrainingBatch {
  id: string;
  courseId: string;
  date: string;
  venue: string;
  seats: number;
  enrolled: string[];
}

export interface CaseOrder {
  caseId: string;
  kind: "transfer order" | "show cause notice";
  at: string;
  by: string;
}

export interface Delegation {
  fromId: string;
  toId: string;
  until: string;
}

export const DOCS = ["Degree certificate", "GATE scorecard", "Caste certificate", "Identity proof", "Police verification", "Medical fitness"];
export const CRITERIA = ["Technical", "Plant safety", "Communication"];

const at = (d: string, t = "09:00") => `${d}T${t}:00+05:30`;

const SEED = {
  cases: [
    { id: "cs-1", kind: "helpdesk", raisedBy: "e-pallabi", subject: "Form 16 for FY 2025-26 not visible", detail: "Payslips page shows only Part B.", status: "open", at: at("2026-10-24", "10:12"), confidential: false, updates: [] },
    { id: "cs-2", kind: "medical", raisedBy: "e-shreya", subject: "Referral to GNRC Guwahati", detail: "Cardiology referral from NRL hospital, cashless request.", status: "in_progress", at: at("2026-10-22", "16:40"), confidential: true, updates: [{ at: at("2026-10-23", "11:00"), by: "e-bhaskar", text: "Referral letter sent to GNRC." }] },
    { id: "cs-3", kind: "grievance", raisedBy: "e-anil", subject: "Night shift allowance short paid", detail: "Four night duties in September, three paid.", status: "open", at: at("2026-10-20", "08:30"), confidential: false, updates: [] },
    { id: "cs-4", kind: "transfer", raisedBy: "e-dipika", subject: "Request transfer to Guwahati corporate office", detail: "Spouse posted in Guwahati.", status: "open", at: at("2026-10-18", "12:00"), confidential: false, updates: [] },
    { id: "cs-5", kind: "discipline", raisedBy: "e-hiren", aboutId: "e-soneswar", subject: "Unauthorised absence, two night shifts", detail: "Crew C, 14 and 15 Oct. Show cause proposed.", status: "in_progress", at: at("2026-10-16", "07:10"), confidential: true, updates: [{ at: at("2026-10-17", "10:00"), by: "e-bhaskar", text: "Show cause notice drafted." }] },
  ] as CaseItem[],
  visitors: [
    { id: "vs-1", name: "R. Venkatesh", org: "Engineers India Ltd", hostId: "e-arup", purpose: "DHDT revamp review", gate: "Gate 1 (Main)", idLast4: "4412", status: "inside", inAt: at("2026-10-27", "09:20") },
    { id: "vs-2", name: "Moumita Das", org: "OISD audit team", hostId: "e-ritu", purpose: "Fire system audit", gate: "Gate 1 (Main)", idLast4: "8810", status: "expected" },
    { id: "vs-3", name: "Pradeep Nair", org: "Honeywell", hostId: "e-hiren", purpose: "DCS patch, CDU", gate: "Gate 2 (CDU West)", idLast4: "2091", status: "left", inAt: at("2026-10-27", "07:05"), outAt: at("2026-10-27", "12:40") },
  ] as Visitor[],
  vehicles: [
    { id: "vh-1", reg: "AS 05 C 4411", kind: "tanker", material: "MS product dispatch", gate: "Gate 3 (Dispatch)", challan: "DSP/26/10/2281", status: "inside", inAt: at("2026-10-27", "08:45") },
    { id: "vh-2", reg: "AS 01 BK 7720", kind: "material", material: "Gaskets and valves, L&T", gate: "Gate 2 (CDU West)", challan: "MAT/26/10/0912", status: "left", inAt: at("2026-10-27", "06:30"), outAt: at("2026-10-27", "07:15") },
    { id: "vh-3", reg: "AS 05 G 0091", kind: "staff bus", material: "Township shift bus", gate: "Gate 1 (Main)", challan: "TWN/BUS/03", status: "inside", inAt: at("2026-10-27", "05:40") },
  ] as Vehicle[],
  handovers: [
    { id: "ho-1", gate: "Gate 2 (CDU West)", by: "e-manoj", shift: "N", at: at("2026-10-27", "05:55"), note: "Two L&T passes blocked for expired H2S. Turnstile 2 slow, maintenance informed." },
  ] as Handover[],
  permits: [
    { id: "pm-1", kind: "hot work", area: "CDU heater H-101", issuerId: "e-hiren", workerIds: ["w-1", "w-2", "w-7"], courseId: "fire", from: "2026-10-27", to: "2026-10-29", status: "active" },
    { id: "pm-2", kind: "confined space", area: "FCC regenerator", issuerId: "e-ritu", workerIds: ["w-4", "w-5"], courseId: "confine", from: "2026-10-26", to: "2026-10-28", status: "active" },
    { id: "pm-3", kind: "height", area: "Utilities cooling tower", issuerId: "e-ritu", workerIds: ["w-3"], courseId: "height", from: "2026-10-20", to: "2026-10-22", status: "closed" },
  ] as Permit[],
  incidents: [
    { id: "in-1", kind: "near miss", area: "CDU pump house", at: at("2026-10-25", "15:20"), reportedBy: "e-hiren", severity: 2, detail: "Scaffold plank slipped, no one below.", status: "open" },
    { id: "in-2", kind: "unsafe act", area: "Tank farm", at: at("2026-10-23", "10:05"), reportedBy: "e-ritu", severity: 1, detail: "Contract worker without face shield at grinding.", status: "closed", action: "Toolbox talk held with L&T crew." },
  ] as Incident[],
  musters: [
    { id: "ms-1", contractorId: "c-lt", date: "2026-10-27", workerIds: ["w-1", "w-2", "w-3", "w-7"], submittedBy: "e-vikram", status: "submitted" },
    { id: "ms-2", contractorId: "c-br", date: "2026-10-27", workerIds: ["w-4", "w-5"], submittedBy: "e-vikram", status: "verified" },
  ] as Muster[],
  workerRequests: [
    { id: "wr-1", contractorId: "c-lt", name: "Bijoy Gogoi", trade: "Rigger", requestedBy: "e-vikram", status: "pending", at: at("2026-10-26", "17:30") },
  ] as WorkerRequest[],
  challans: [
    { id: "ch-1", contractorId: "c-lt", month: "2026-09", kind: "EPF", paid: 412800, due: 412800, status: "pending" },
    { id: "ch-2", contractorId: "c-lt", month: "2026-09", kind: "ESI", paid: 61200, due: 64900, status: "pending" },
    { id: "ch-3", contractorId: "c-br", month: "2026-09", kind: "EPF", paid: 168400, due: 168400, status: "verified" },
    { id: "ch-4", contractorId: "c-sis", month: "2026-09", kind: "EPF", paid: 121000, due: 121000, status: "pending" },
  ] as Challan[],
  interviews: [
    { id: "iv-1", candidateId: "cd-1", at: at("2026-10-30", "10:30"), panel: ["e-arup", "e-bhaskar"], scores: {}, docs: { "Degree certificate": true, "GATE scorecard": true } },
    { id: "iv-2", candidateId: "cd-2", at: at("2026-10-21", "11:00"), panel: ["e-arup", "e-kaushik"], scores: { Technical: 8, "Plant safety": 7, Communication: 8 }, docs: { "Degree certificate": true, "GATE scorecard": true, "Caste certificate": true, "Identity proof": true } },
  ] as Interview[],
  cleared: {} as Record<string, { by: string; reason: string; at: string }>,
  overtime: [
    { id: "ot-1", employeeId: "e-bikash", date: "2026-10-27", hours: 3, reason: "Held over for CDU heater H-101 hot work, relief late", status: "pending" },
    { id: "ot-2", employeeId: "e-soneswar", date: "2026-10-26", hours: 2.5, reason: "Night shift extended, crew short by one", status: "pending" },
    { id: "ot-3", employeeId: "e-juri", date: "2026-10-24", hours: 2, reason: "Pump changeover, P-104", status: "approved", by: "e-hiren" },
  ] as OvertimeRequest[],
  shiftHandovers: [
    { id: "sh-1", unitId: "cdu", shift: "N", by: "e-hiren", at: "2026-10-27T05:50:00+05:30", note: "Heater H-101 hot work permit continues on morning shift. P-104 on standby after changeover. Crew B one short, relief arranged." },
  ] as ShiftHandover[],
  bankAcks: [] as BankAck[],
  wages: [
    { id: "wg-1", contractorId: "c-lt", skill: "Unskilled", workers: 46, paidDaily: 610 },
    { id: "wg-2", contractorId: "c-lt", skill: "Skilled", workers: 38, paidDaily: 790 },
    { id: "wg-3", contractorId: "c-br", skill: "Semi-skilled", workers: 30, paidDaily: 640 },
    { id: "wg-4", contractorId: "c-br", skill: "Highly skilled", workers: 12, paidDaily: 960 },
    { id: "wg-5", contractorId: "c-sis", skill: "Unskilled", workers: 34, paidDaily: 640 },
  ] as WageRow[],
  batches: [
    { id: "tb-1", courseId: "fire", date: "2026-11-03", venue: "Fire station training hall", seats: 25, enrolled: [] },
    { id: "tb-2", courseId: "h2s", date: "2026-11-05", venue: "HSE classroom, admin block", seats: 20, enrolled: [] },
    { id: "tb-3", courseId: "height", date: "2026-11-10", venue: "Scaffold yard, utilities", seats: 15, enrolled: [] },
  ] as TrainingBatch[],
  orders: [] as CaseOrder[],
  delegation: null as Delegation | null,
};

const uid = (p: string) => `${p}-${Math.random().toString(36).slice(2, 7)}`;
const now = () => new Date().toISOString();

type DeskState = typeof SEED & {
  raiseCase: (c: Omit<CaseItem, "id" | "status" | "at" | "updates">) => void;
  moveCase: (id: string, status: CaseStatus, by: string, text: string) => void;
  addVisitor: (v: Omit<Visitor, "id" | "status">) => void;
  moveVisitor: (id: string) => void;
  addVehicle: (v: Omit<Vehicle, "id" | "status" | "inAt">) => void;
  exitVehicle: (id: string) => void;
  addHandover: (h: Omit<Handover, "id" | "at">) => void;
  addPermit: (p: Omit<Permit, "id" | "status">) => void;
  setPermit: (id: string, status: Permit["status"]) => void;
  reportIncident: (i: Omit<Incident, "id" | "at" | "status">) => void;
  closeIncident: (id: string, action: string) => void;
  submitMuster: (m: Omit<Muster, "id" | "status">) => void;
  decideMuster: (id: string, status: "verified" | "disputed", note?: string) => void;
  requestWorker: (r: Omit<WorkerRequest, "id" | "status" | "at">) => void;
  decideWorker: (id: string, status: "approved" | "rejected") => void;
  checkChallan: (id: string) => void;
  schedule: (i: Omit<Interview, "id" | "scores" | "docs">) => void;
  score: (id: string, panelist: string, value: number) => void;
  tickDoc: (id: string, doc: string) => void;
  issueOffer: (id: string) => void;
  clearException: (key: string, by: string, reason: string) => void;
  delegate: (d: Delegation | null) => void;
  requestOvertime: (o: Omit<OvertimeRequest, "id" | "status">) => void;
  decideOvertime: (id: string, status: "approved" | "rejected", by: string) => void;
  addShiftHandover: (h: Omit<ShiftHandover, "id" | "at">) => void;
  recordBankAck: (a: Omit<BankAck, "at">) => void;
  sendWageNotice: (id: string) => void;
  addBatch: (b: Omit<TrainingBatch, "id" | "enrolled">) => void;
  enrolBatch: (id: string, people: string[]) => void;
  issueOrder: (o: Omit<CaseOrder, "at">) => void;
  sendCallLetter: (id: string) => void;
  resetDesk: () => void;
};

export const useDesk = create<DeskState>()(
  persist(
    (set) => ({
      ...SEED,
      raiseCase: (c) => set((s) => ({ cases: [{ ...c, id: uid("cs"), status: "open", at: now(), updates: [] }, ...s.cases] })),
      moveCase: (id, status, by, text) =>
        set((s) => ({ cases: s.cases.map((c) => (c.id === id ? { ...c, status, updates: [...c.updates, { at: now(), by, text }] } : c)) })),
      addVisitor: (v) => set((s) => ({ visitors: [{ ...v, id: uid("vs"), status: "expected" }, ...s.visitors] })),
      moveVisitor: (id) =>
        set((s) => ({
          visitors: s.visitors.map((v) =>
            v.id !== id ? v : v.status === "expected" ? { ...v, status: "inside", inAt: now() } : { ...v, status: "left", outAt: now() },
          ),
        })),
      addVehicle: (v) => set((s) => ({ vehicles: [{ ...v, id: uid("vh"), status: "inside", inAt: now() }, ...s.vehicles] })),
      exitVehicle: (id) => set((s) => ({ vehicles: s.vehicles.map((v) => (v.id === id ? { ...v, status: "left", outAt: now() } : v)) })),
      addHandover: (h) => set((s) => ({ handovers: [{ ...h, id: uid("ho"), at: now() }, ...s.handovers] })),
      addPermit: (p) => set((s) => ({ permits: [{ ...p, id: uid("pm"), status: "active" }, ...s.permits] })),
      setPermit: (id, status) => set((s) => ({ permits: s.permits.map((p) => (p.id === id ? { ...p, status } : p)) })),
      reportIncident: (i) => set((s) => ({ incidents: [{ ...i, id: uid("in"), at: now(), status: "open" }, ...s.incidents] })),
      closeIncident: (id, action) => set((s) => ({ incidents: s.incidents.map((i) => (i.id === id ? { ...i, status: "closed", action } : i)) })),
      submitMuster: (m) => set((s) => ({ musters: [{ ...m, id: uid("ms"), status: "submitted" }, ...s.musters] })),
      decideMuster: (id, status, note) => set((s) => ({ musters: s.musters.map((m) => (m.id === id ? { ...m, status, note } : m)) })),
      requestWorker: (r) => set((s) => ({ workerRequests: [{ ...r, id: uid("wr"), status: "pending", at: now() }, ...s.workerRequests] })),
      decideWorker: (id, status) => set((s) => ({ workerRequests: s.workerRequests.map((r) => (r.id === id ? { ...r, status } : r)) })),
      checkChallan: (id) =>
        set((s) => ({ challans: s.challans.map((c) => (c.id === id ? { ...c, status: c.paid >= c.due ? "verified" : "short" } : c)) })),
      schedule: (i) => set((s) => ({ interviews: [{ ...i, id: uid("iv"), scores: {}, docs: {} }, ...s.interviews] })),
      score: (id, criterion, value) =>
        set((s) => ({ interviews: s.interviews.map((i) => (i.id === id ? { ...i, scores: { ...i.scores, [criterion]: value } } : i)) })),
      tickDoc: (id, doc) =>
        set((s) => ({ interviews: s.interviews.map((i) => (i.id === id ? { ...i, docs: { ...i.docs, [doc]: !i.docs[doc] } } : i)) })),
      issueOffer: (id) => set((s) => ({ interviews: s.interviews.map((i) => (i.id === id ? { ...i, offerAt: now() } : i)) })),
      clearException: (key, by, reason) => set((s) => ({ cleared: { ...s.cleared, [key]: { by, reason, at: now() } } })),
      delegate: (d) => set({ delegation: d }),
      requestOvertime: (o) => set((s) => ({ overtime: [{ ...o, id: uid("ot"), status: "pending" }, ...s.overtime] })),
      decideOvertime: (id, status, by) => set((s) => ({ overtime: s.overtime.map((o) => (o.id === id ? { ...o, status, by } : o)) })),
      addShiftHandover: (h) => set((s) => ({ shiftHandovers: [{ ...h, id: uid("sh"), at: now() }, ...s.shiftHandovers] })),
      recordBankAck: (a) => set((s) => ({ bankAcks: [{ ...a, at: now() }, ...s.bankAcks.filter((x) => x.runId !== a.runId)] })),
      sendWageNotice: (id) => set((s) => ({ wages: s.wages.map((w) => (w.id === id ? { ...w, noticeAt: now() } : w)) })),
      addBatch: (b) => set((s) => ({ batches: [...s.batches, { ...b, id: uid("tb"), enrolled: [] }].sort((x, y) => x.date.localeCompare(y.date)) })),
      enrolBatch: (id, people) =>
        set((s) => ({
          batches: s.batches.map((b) => (b.id === id ? { ...b, enrolled: [...new Set([...b.enrolled, ...people])].slice(0, b.seats) } : b)),
        })),
      issueOrder: (o) => set((s) => ({ orders: [{ ...o, at: now() }, ...s.orders] })),
      sendCallLetter: (id) => set((s) => ({ interviews: s.interviews.map((i) => (i.id === id ? { ...i, callLetterAt: now() } : i)) })),
      resetDesk: () => set({ ...SEED }),
    }),
    { name: "nrl-desk", version: 3 },
  ),
);

export const CASE_LABEL: Record<CaseKind, string> = {
  helpdesk: "Helpdesk",
  grievance: "Grievance",
  discipline: "Discipline",
  transfer: "Transfer or deputation",
  medical: "Medical or hospital",
};

export const GATES = ["Gate 1 (Main)", "Gate 2 (CDU West)", "Gate 3 (Dispatch)"];

/* Central sphere minimum daily wage, area B (demo values: confirm the current VDA-revised notification). */
export const MIN_WAGE: Record<WageRow["skill"], number> = {
  Unskilled: 626,
  "Semi-skilled": 694,
  Skilled: 773,
  "Highly skilled": 845,
};

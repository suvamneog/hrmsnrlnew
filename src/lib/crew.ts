import { DEMO_TODAY } from "./demo";
import type { Certificate, ContractWorker, Contractor, GateEvent, GatePass } from "./types";

const FIRST = [
  "Sanjay", "Nurul", "Lakshmi", "Prakash", "Anita", "Dhan", "Ramesh", "Biren", "Sunita", "Ajay",
  "Kamala", "Suresh", "Geeta", "Raju", "Manju", "Deepak", "Poonam", "Vijay", "Asha", "Manoj",
];
const LAST = [
  "Yadav", "Islam", "Kisku", "Oraon", "Minj", "Rai", "Paswan", "Tudu", "Hembram", "Soren",
  "Munda", "Lakra", "Toppo", "Kujur", "Bara", "Xalxo", "Kerketta", "Ekka", "Dhanwar", "Bhagat",
];
const SKILLS: Record<string, string[]> = {
  "c-lt": ["Rigger", "Welder-6G", "Scaffolder", "Grinder", "Fitter", "Helper", "Crane operator"],
  "c-br": ["Fitter", "Helper", "Rigger", "Scaffolder", "Pipe fitter"],
  "c-sis": ["Security guard", "Supervisor", "CCTV operator"],
};

export const CREW_TARGET = 186;

export function generatedWorkers(named: ContractWorker[]): ContractWorker[] {
  const need = Math.max(0, CREW_TARGET - named.length);
  const ids = ["c-lt", "c-lt", "c-lt", "c-br", "c-br", "c-sis"] as const;
  return Array.from({ length: need }, (_, i) => {
    const contractorId = ids[i % ids.length];
    const skills = SKILLS[contractorId];
    const first = FIRST[i % FIRST.length];
    const last = LAST[(i * 3) % LAST.length];
    const n = 10000 + i;
    return {
      id: `w-g-${String(i + 1).padStart(3, "0")}`,
      contractorId,
      name: `${first} ${last}`,
      skill: skills[i % skills.length],
      aadhaar: String(400000000000 + i),
      uan: String(101400000000 + i),
      esic: String(2211000000 + i),
      policeVerification: i % 17 !== 0,
      medicalFitnessExpiry: i % 23 === 0 ? "2026-09-12" : "2027-04-18",
      photoSeed: `${first}${last}${i}`,
      blacklisted: false,
      inductionPassed: i % 17 !== 0 && i % 23 !== 0,
    } satisfies ContractWorker;
  });
}

export function expandPasses(workers: ContractWorker[], contractors: Contractor[], certs: Certificate[]): GatePass[] {
  return workers.map((w, i) => {
    const c = contractors.find((x) => x.id === w.contractorId);
    const ind = certs.find((ct) => ct.personId === w.id && ct.courseId === "ind");
    const blocked =
      w.blacklisted ||
      !w.policeVerification ||
      w.medicalFitnessExpiry < DEMO_TODAY ||
      !w.inductionPassed ||
      !c ||
      c.licenceExpiry < DEMO_TODAY ||
      !ind ||
      ind.expires < DEMO_TODAY;
    return {
      id: `gp-${i + 1}`,
      workerId: w.id,
      validFrom: "2026-08-01",
      validTo: c?.workOrderEnd ?? "2027-03-31",
      blocked,
      blockReason: blocked
        ? !w.policeVerification
          ? "Police verification pending"
          : w.medicalFitnessExpiry < DEMO_TODAY
            ? "Medical fitness expired"
            : "Mandatory certificate expired"
        : undefined,
    };
  });
}

// Induction for everyone who passed it, plus a trade certificate for most, with expiries spread
// over the coming months so the safety due-lists have something real to show.
const TRADE: Record<string, string> = {
  Rigger: "height",
  Scaffolder: "height",
  "Crane operator": "height",
  "Welder-6G": "fire",
  Grinder: "fire",
  Fitter: "confine",
  "Pipe fitter": "confine",
  Helper: "h2s",
};

function plusDays(days: number) {
  const d = new Date(`${DEMO_TODAY}T00:00:00`);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export function expandCerts(workers: ContractWorker[], named: Certificate[]): Certificate[] {
  const extra: Certificate[] = [];
  workers.forEach((w, i) => {
    if (named.some((c) => c.personId === w.id)) return;
    if (!w.inductionPassed) return;
    extra.push({
      id: `ct-${w.id}`,
      personId: w.id,
      personKind: "contract",
      courseId: "ind",
      issued: "2026-02-11",
      expires: "2027-02-11",
    });
    const course = TRADE[w.skill];
    if (!course || i % 5 === 4) return;
    // Spread from 20 days ago to about four months out.
    const expires = plusDays(((i * 37) % 140) - 20);
    extra.push({ id: `ct-${w.id}-${course}`, personId: w.id, personKind: "contract", courseId: course, issued: "2025-11-01", expires });
  });
  return [...named, ...extra];
}

// A plant day at the gates: entries through the morning and the 14:00 change, exits after each shift.
export function expandGateEvents(passes: GatePass[], named: GateEvent[]): GateEvent[] {
  const extra: GateEvent[] = [];
  let n = named.length;
  const at = (h: number, m: number) => `${DEMO_TODAY}T${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:00+05:30`;
  const open = passes.filter((p) => !p.blocked).slice(0, 150);
  open.forEach((p, i) => {
    const gate = p.workerId.endsWith("1") ? "Gate 1" : p.workerId.endsWith("2") ? "Gate 3" : "Gate 2";
    const afternoon = i % 4 === 3;
    const inH = afternoon ? 13 : 6 + (i % 4);
    extra.push({ id: `ge-g-${++n}`, passId: p.id, gate, direction: "in", time: at(inH, (i * 7) % 60) });
    // About half the morning crew has left by evening.
    if (!afternoon && i % 2 === 0) {
      extra.push({ id: `ge-g-${++n}`, passId: p.id, gate, direction: "out", time: at(14 + (i % 4), (i * 11) % 60) });
    }
  });
  return [...named, ...extra];
}

export function mergeCrew(named: ContractWorker[]) {
  const seen = new Set(named.map((w) => w.id));
  const extra = generatedWorkers(named).filter((w) => !seen.has(w.id));
  return [...named.filter((w) => !w.id.startsWith("w-g-")), ...extra];
}

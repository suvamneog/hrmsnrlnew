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

export function expandCerts(workers: ContractWorker[], named: Certificate[]): Certificate[] {
  const extra: Certificate[] = [];
  for (const w of workers) {
    if (named.some((c) => c.personId === w.id)) continue;
    if (!w.inductionPassed) continue;
    extra.push({
      id: `ct-${w.id}`,
      personId: w.id,
      personKind: "contract",
      courseId: "ind",
      issued: "2026-02-11",
      expires: "2027-02-11",
    });
  }
  return [...named, ...extra];
}

export function expandGateEvents(passes: GatePass[], named: GateEvent[]): GateEvent[] {
  const extra: GateEvent[] = [];
  let n = named.length;
  const open = passes.filter((p) => !p.blocked);
  const inside = open.slice(0, 92);
  for (const p of inside) {
    extra.push({
      id: `ge-g-${++n}`,
      passId: p.id,
      gate: p.workerId.endsWith("1") ? "Gate 1" : p.workerId.endsWith("2") ? "Gate 3" : "Gate 2",
      direction: "in",
      time: `2026-10-27T0${6 + (n % 3)}:${String(10 + (n % 50)).padStart(2, "0")}:00+05:30`,
    });
  }
  return [...named, ...extra];
}

export function mergeCrew(named: ContractWorker[]) {
  const seen = new Set(named.map((w) => w.id));
  const extra = generatedWorkers(named).filter((w) => !seen.has(w.id));
  return [...named.filter((w) => !w.id.startsWith("w-g-")), ...extra];
}

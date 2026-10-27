import { DEMO_TODAY } from "./demo";
import type { Certificate, Contractor, ContractWorker } from "./types";

export function passBlockReason(args: {
  worker: ContractWorker;
  contractor: Contractor | undefined;
  certs: Certificate[];
  today?: string;
}): string | undefined {
  const today = args.today ?? DEMO_TODAY;
  const { worker, contractor, certs } = args;
  if (worker.blacklisted) return "Blacklisted — do not admit";
  if (!worker.policeVerification) return "Police verification pending";
  if (worker.medicalFitnessExpiry < today) return "Medical fitness expired";
  if (!worker.inductionPassed) return "Plant induction not passed";
  if (!contractor) return "Contractor not on register";
  if (contractor.licenceExpiry < today) return "Contractor licence expired";
  if (contractor.workOrderEnd < today) return "Work order expired";
  const ind = certs.find((c) => c.personId === worker.id && c.courseId === "ind");
  if (!ind || ind.expires < today) return "Mandatory certificate expired";
  return undefined;
}

export function daysToLicence(expiry: string, today = DEMO_TODAY) {
  const a = Date.parse(`${today}T00:00:00`);
  const b = Date.parse(`${expiry}T00:00:00`);
  return Math.round((b - a) / 86400000);
}

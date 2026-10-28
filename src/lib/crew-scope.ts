"use client";

import { useCurrentUser, useHrms } from "./store";

/* A contractor supervisor sees only their own firm's crew; everyone else sees the plant. */
export function useCrewScope() {
  const me = useCurrentUser();
  const role = useHrms((s) => s.actingRole);
  const contractorsAll = useHrms((s) => s.contractors);
  const workersAll = useHrms((s) => s.workers);
  const passesAll = useHrms((s) => s.passes);
  const eventsAll = useHrms((s) => s.gateEvents);
  const punchesAll = useHrms((s) => s.punches);
  if (role !== "contractor_supervisor") {
    return { scoped: false, contractors: contractorsAll, workers: workersAll, passes: passesAll, events: eventsAll, punches: punchesAll };
  }
  const contractors = contractorsAll.filter((c) => c.supervisorId === me?.id || c.id === me?.contractorId);
  const cids = new Set(contractors.map((c) => c.id));
  const workers = workersAll.filter((w) => cids.has(w.contractorId));
  const wids = new Set(workers.map((w) => w.id));
  const passes = passesAll.filter((p) => wids.has(p.workerId));
  const pids = new Set(passes.map((p) => p.id));
  // NRL staff punches are not the supervisor's business, so they are left out entirely.
  return { scoped: true, contractors, workers, passes, events: eventsAll.filter((e) => pids.has(e.passId)), punches: [] };
}

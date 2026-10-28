import type { Employee } from "./types";

/* The demo roll is a generated sample. NRL's published on-roll strength is shown beside it. */
export const PUBLISHED_ON_ROLL = 1120;
export const SAMPLE_NOTE = "Demo sample. NRL publishes 1,120 on roll.";

export const CENSUS = {
  onRoll: 1588,
  executives: 412,
  workmen: 1084,
  trainees: 92,
  women: 186,
  pwbd: 24,
  onLeave: 42,
  contractInPlant: 186,
  category: { UR: 720, OBC: 428, SC: 238, ST: 142, EWS: 60 } as Record<string, number>,
};

export function liveCensus(employees: Employee[]) {
  const on = employees.filter((e) => e.cadre !== "contract" && e.status !== "separated");
  const category = { UR: 0, OBC: 0, SC: 0, ST: 0, EWS: 0 } as Record<string, number>;
  for (const e of on) category[e.category] = (category[e.category] ?? 0) + 1;
  return {
    onRoll: on.length,
    executives: on.filter((e) => e.cadre === "executive").length,
    workmen: on.filter((e) => e.cadre === "workman").length,
    trainees: on.filter((e) => e.cadre === "trainee").length,
    women: on.filter((e) => e.gender === "F").length,
    pwbd: on.filter((e) => e.pwbd).length,
    category,
  };
}

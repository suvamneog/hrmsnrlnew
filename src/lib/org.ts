import type { Cadre, LocationId, OrgUnit, Position } from "./types";

export const LOCATIONS: { id: LocationId; name: string; cityClass: "X" | "Y" | "Z" }[] = [
  { id: "numaligarh", name: "Numaligarh refinery & township", cityClass: "Z" },
  { id: "siliguri", name: "Siliguri marketing terminal", cityClass: "Y" },
  { id: "paradip", name: "Paradip crude terminal", cityClass: "Z" },
  { id: "guwahati", name: "Guwahati office", cityClass: "Y" },
];

export const UNITS: OrgUnit[] = [
  { id: "nrl", name: "Numaligarh Refinery Limited", kind: "company", locationId: "numaligarh" },
  { id: "num", name: "Numaligarh", parentId: "nrl", kind: "location", locationId: "numaligarh" },
  { id: "slg", name: "Siliguri", parentId: "nrl", kind: "location", locationId: "siliguri" },
  { id: "prt", name: "Paradip", parentId: "nrl", kind: "location", locationId: "paradip" },
  { id: "ghy", name: "Guwahati", parentId: "nrl", kind: "location", locationId: "guwahati" },
  { id: "ops", name: "Operations", parentId: "num", kind: "department", locationId: "numaligarh" },
  { id: "cdu", name: "CDU / NDU", parentId: "ops", kind: "unit", locationId: "numaligarh" },
  { id: "fcc", name: "FCC / DHDT", parentId: "ops", kind: "unit", locationId: "numaligarh" },
  { id: "util", name: "Utilities & offsites", parentId: "ops", kind: "unit", locationId: "numaligarh" },
  { id: "tech", name: "Technical", parentId: "num", kind: "department", locationId: "numaligarh" },
  { id: "hse", name: "HSE", parentId: "num", kind: "department", locationId: "numaligarh" },
  { id: "hr", name: "Human resources", parentId: "num", kind: "department", locationId: "numaligarh" },
  { id: "fin", name: "Finance", parentId: "num", kind: "department", locationId: "numaligarh" },
  { id: "twn", name: "Township", parentId: "num", kind: "department", locationId: "numaligarh" },
  { id: "mkt-slg", name: "Marketing terminal", parentId: "slg", kind: "department", locationId: "siliguri" },
  { id: "crd-prt", name: "Crude terminal", parentId: "prt", kind: "department", locationId: "paradip" },
  { id: "corp-ghy", name: "Corporate office", parentId: "ghy", kind: "department", locationId: "guwahati" },
];

const STRENGTH_UNITS = [
  { id: "cdu", cadre: "executive" as const, grades: ["E2", "E3", "E4"] },
  { id: "cdu", cadre: "workman" as const, grades: ["W2", "W4", "W5"] },
  { id: "util", cadre: "executive" as const, grades: ["E2", "E3"] },
  { id: "util", cadre: "workman" as const, grades: ["W4"] },
  { id: "tech", cadre: "executive" as const, grades: ["E2", "E3", "E4", "E5", "E6"] },
  { id: "tech", cadre: "workman" as const, grades: ["W3"] },
  { id: "tech", cadre: "trainee" as const, grades: ["ET"] },
  { id: "hse", cadre: "executive" as const, grades: ["E3", "E4", "E5"] },
  { id: "hse", cadre: "workman" as const, grades: ["W5"] },
  { id: "hr", cadre: "executive" as const, grades: ["E2", "E3", "E4", "E5", "E6"] },
  { id: "fin", cadre: "executive" as const, grades: ["E2", "E3", "E4", "E5", "E6"] },
  { id: "twn", cadre: "executive" as const, grades: ["E2", "E3", "E4"] },
  { id: "ops", cadre: "trainee" as const, grades: ["ET"] },
  { id: "fcc", cadre: "workman" as const, grades: ["W4", "W6"] },
  { id: "mkt-slg", cadre: "executive" as const, grades: ["E2", "E3", "E4"] },
  { id: "crd-prt", cadre: "executive" as const, grades: ["E2", "E3", "E4", "E5"] },
  { id: "corp-ghy", cadre: "executive" as const, grades: ["E2", "E3", "E4", "E5", "E6"] },
];

const EXEC_RANK: Record<string, string> = {
  E2: "Engineer",
  E3: "Dy Manager",
  E4: "Manager",
  E5: "DGM",
  E6: "CGM",
};

const AREA: Record<string, string> = {
  cdu: "CDU",
  fcc: "FCC",
  util: "Utilities",
  tech: "Technical",
  hse: "HSE",
  hr: "HR",
  fin: "Finance",
  twn: "Township",
  ops: "Operations",
  "mkt-slg": "Siliguri",
  "crd-prt": "Paradip",
  "corp-ghy": "Guwahati",
};

function strengthTitle(unitId: string, grade: string, cadre: Cadre) {
  const area = AREA[unitId] ?? unitId;
  if (cadre === "trainee") {
    return unitId === "ops" ? "Engineer trainee (Chemical)" : "Engineer trainee (Mechanical)";
  }
  if (cadre === "workman") {
    if (unitId === "hse" && grade === "W5") return "Leading fireman";
    if (unitId === "tech" && grade === "W3") return "Lab analyst";
    if (unitId === "util" && grade === "W4") return "Fitter, utilities";
    if (unitId === "cdu" && grade === "W2") return "Helper, CDU";
    if (unitId === "cdu" && grade === "W4") return "Instrument technician, CDU";
    if (unitId === "cdu" && grade === "W5") return "Panel operator, CDU";
    if (unitId === "fcc" && grade === "W4") return "Technician (Mechanical), FCC";
    if (unitId === "fcc" && grade === "W6") return "Senior operator, FCC";
    return `Operator, ${area}`;
  }
  const rank = EXEC_RANK[grade] ?? "Officer";
  return `${rank} (${area})`;
}

export function strengthPositionId(unitId: string, grade: string) {
  return `p-str-${unitId}-${grade}`;
}

export const STRENGTH_POSITIONS: Position[] = STRENGTH_UNITS.flatMap((u) =>
  u.grades.map((grade) => ({
    id: strengthPositionId(u.id, grade),
    title: strengthTitle(u.id, grade, u.cadre),
    unitId: u.id,
    grade,
    cadre: u.cadre,
    vacant: false,
  })),
);

export const POSITIONS: Position[] = [
  { id: "p-cgm-tech", title: "CGM (Technical)", unitId: "tech", grade: "E6", cadre: "executive", vacant: false },
  { id: "p-gm-hr", title: "GM (HR)", unitId: "hr", grade: "E7", cadre: "executive", vacant: false },
  { id: "p-dgm-ops", title: "DGM (Operations)", unitId: "ops", grade: "E5", cadre: "executive", vacant: false },
  { id: "p-mgr-fin", title: "Manager (Payroll)", unitId: "fin", grade: "E4", cadre: "executive", vacant: false },
  { id: "p-dy-hse", title: "Dy Manager (HSE)", unitId: "hse", grade: "E3", cadre: "executive", vacant: false },
  { id: "p-sic-cdu", title: "Shift-in-charge, CDU", unitId: "cdu", grade: "E4", cadre: "executive", vacant: false },
  { id: "p-eng-el", title: "Engineer (Electrical)", unitId: "util", grade: "E2", cadre: "executive", vacant: false },
  { id: "p-mgr-mkt", title: "Manager (Marketing)", unitId: "mkt-slg", grade: "E3", cadre: "executive", vacant: false },
  { id: "p-eng-prt", title: "Engineer (Terminal)", unitId: "crd-prt", grade: "E2", cadre: "executive", vacant: false },
  { id: "p-mgr-twn", title: "Manager (Township)", unitId: "twn", grade: "E3", cadre: "executive", vacant: false },
  { id: "p-op-cdu", title: "Panel operator, CDU", unitId: "cdu", grade: "W5", cadre: "workman", vacant: false },
  { id: "p-tech-mech", title: "Technician (Mechanical)", unitId: "fcc", grade: "W4", cadre: "workman", vacant: false },
  { id: "p-op-fcc", title: "Senior operator, FCC", unitId: "fcc", grade: "W6", cadre: "workman", vacant: false },
  { id: "p-lab", title: "Lab analyst", unitId: "tech", grade: "W3", cadre: "workman", vacant: false },
  { id: "p-fitter", title: "Fitter", unitId: "util", grade: "W4", cadre: "workman", vacant: false },
  { id: "p-fire", title: "Leading fireman", unitId: "hse", grade: "W5", cadre: "workman", vacant: false },
  { id: "p-helper", title: "Helper", unitId: "cdu", grade: "W2", cadre: "workman", vacant: false },
  { id: "p-inst", title: "Instrument technician", unitId: "cdu", grade: "W4", cadre: "workman", vacant: false },
  { id: "p-et-mech", title: "Engineer trainee (Mechanical)", unitId: "tech", grade: "ET", cadre: "trainee", vacant: false },
  { id: "p-et-chem", title: "Engineer trainee (Chemical)", unitId: "ops", grade: "ET", cadre: "trainee", vacant: false },
  { id: "p-vac-e3", title: "Dy Manager (Projects)", unitId: "tech", grade: "E3", cadre: "executive", vacant: true },
  { id: "p-sup-lt", title: "Contractor supervisor, L&T", unitId: "cdu", grade: "CS", cadre: "contract", vacant: false },
  ...STRENGTH_POSITIONS,
];

export function unitName(id: string) {
  return UNITS.find((u) => u.id === id)?.name ?? id;
}

export function positionTitle(id: string) {
  return POSITIONS.find((p) => p.id === id)?.title ?? "Officer";
}

export function locationName(id: LocationId) {
  return LOCATIONS.find((l) => l.id === id)?.name ?? id;
}

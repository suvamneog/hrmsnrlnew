import { CENSUS } from "./census";
import { STRENGTH_POSITIONS, UNITS } from "./org";
import type { Cadre, Category, Employee, LocationId } from "./types";

const FIRST_M = [
  "Anirban", "Partha", "Nayan", "Mrinal", "Hemanta", "Utpal", "Prasanta", "Diganta",
  "Sanjib", "Tridip", "Gautam", "Bhupen", "Ranjit", "Pradip", "Nitul", "Jintu",
  "Abhijit", "Chandan", "Dhruba", "Manash", "Pankaj", "Saurav", "Bitupan", "Homen",
];
const FIRST_F = [
  "Barsha", "Mayuri", "Indrani", "Sangeeta", "Pooja", "Kakumoni", "Nirmali", "Parishmita",
  "Ankita", "Bhaswati", "Runjun", "Devyani", "Priyanka", "Sushmita", "Gariyashi", "Jahnabi",
  "Lakhimi", "Manisha", "Nandita", "Rashmi",
];
const LAST = [
  "Bora", "Das", "Kalita", "Gogoi", "Saikia", "Baruah", "Dutta", "Sarmah", "Hazarika",
  "Pegu", "Teron", "Karmakar", "Chetia", "Deka", "Barman", "Devi", "Nath", "Rongpi",
  "Basumatary", "Borah", "Phukan", "Handique", "Mahanta", "Patowary", "Chutia", "Puzari",
];

const EXEC_GRADES = [
  { grade: "E2", basic: 62400 },
  { grade: "E3", basic: 81200 },
  { grade: "E4", basic: 96400 },
  { grade: "E5", basic: 112400 },
  { grade: "E6", basic: 136800 },
];
const WORK_GRADES = [
  { grade: "W2", basic: 28600 },
  { grade: "W3", basic: 34100 },
  { grade: "W4", basic: 37200 },
  { grade: "W5", basic: 42800 },
  { grade: "W6", basic: 49200 },
];
const IFSC: Record<LocationId, string> = {
  numaligarh: "SBIN0003180",
  siliguri: "SBIN0000125",
  paradip: "SBIN0002100",
  guwahati: "SBIN0000078",
};

function pad(n: number, w = 4) {
  return String(n).padStart(w, "0");
}

function fill<T>(value: T, n: number): T[] {
  return Array.from({ length: Math.max(0, n) }, () => value);
}

function spread(n: number, total: number) {
  const s = new Set<number>();
  const take = Math.min(Math.max(0, n), total);
  for (let i = 0; i < take; i++) s.add(Math.floor((i * total) / take));
  return s;
}

function panFor(i: number) {
  const L = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  return `${L[i % 26]}${L[(i * 3) % 26]}P${L[(i * 7) % 26]}${L[(i * 11) % 26]}${String(1000 + (i % 9000)).slice(-4)}${L[(i * 13) % 26]}`;
}

export function isGenerated(id: string) {
  return id.startsWith("g-");
}

export function generatedEmployees(named: Employee[]): Employee[] {
  const onRoll = named.filter((e) => e.cadre !== "contract" && e.status !== "separated");
  const needExec = CENSUS.executives - onRoll.filter((e) => e.cadre === "executive").length;
  const needWork = CENSUS.workmen - onRoll.filter((e) => e.cadre === "workman").length;
  const needTrain = CENSUS.trainees - onRoll.filter((e) => e.cadre === "trainee").length;
  const cadreList: Cadre[] = [
    ...fill("executive" as const, needExec),
    ...fill("workman" as const, needWork),
    ...fill("trainee" as const, needTrain),
  ];
  const catList: Category[] = [
    ...fill("UR" as const, CENSUS.category.UR - onRoll.filter((e) => e.category === "UR").length),
    ...fill("OBC" as const, CENSUS.category.OBC - onRoll.filter((e) => e.category === "OBC").length),
    ...fill("SC" as const, CENSUS.category.SC - onRoll.filter((e) => e.category === "SC").length),
    ...fill("ST" as const, CENSUS.category.ST - onRoll.filter((e) => e.category === "ST").length),
    ...fill("EWS" as const, CENSUS.category.EWS - onRoll.filter((e) => e.category === "EWS").length),
  ];
  while (catList.length < cadreList.length) catList.push("UR");
  catList.length = cadreList.length;

  const women = spread(CENSUS.women - onRoll.filter((e) => e.gender === "F").length, cadreList.length);
  const pwbd = spread(CENSUS.pwbd - onRoll.filter((e) => e.pwbd).length, cadreList.length);

  return cadreList.map((cadre, i) => {
    const gender: Employee["gender"] = women.has(i) ? "F" : "M";
    const first = gender === "F" ? FIRST_F[i % FIRST_F.length] : FIRST_M[i % FIRST_M.length];
    const last = LAST[(i * 3) % LAST.length];
    const posts = STRENGTH_POSITIONS.filter((p) => p.cadre === cadre);
    const pos = posts[i % Math.max(posts.length, 1)] ?? STRENGTH_POSITIONS[0];
    const unit = UNITS.find((u) => u.id === pos.unitId);
    const locationId = unit?.locationId ?? "numaligarh";
    const pay =
      cadre === "trainee"
        ? { grade: pos.grade, basic: 50000 }
        : cadre === "workman"
          ? (WORK_GRADES.find((x) => x.grade === pos.grade) ?? WORK_GRADES[0])
          : (EXEC_GRADES.find((x) => x.grade === pos.grade) ?? EXEC_GRADES[0]);
    const year = 1998 + (i % 27);
    const seq = 500 + i;
    const prefix = cadre === "workman" ? "W" : cadre === "trainee" ? "T" : "E";
    return {
      id: `g-${pad(i + 1)}`,
      empNo: `NRL/${prefix}/${year}/${pad(seq, 3)}`,
      name: `${first} ${last}`,
      preferredName: first,
      gender,
      dob: `${1968 + (i % 30)}-${pad((i % 12) + 1, 2)}-${pad((i % 28) + 1, 2)}`,
      doj: `${year}-${pad((i % 12) + 1, 2)}-01`,
      email: `${first.toLowerCase()}.${last.toLowerCase()}${i + 1}@nrl.co.in`,
      phone: `+91 ${9000000000 + i}`,
      category: catList[i],
      pwbd: pwbd.has(i),
      cadre,
      grade: pay.grade,
      basic: pay.basic,
      cafeteriaPct: cadre === "executive" ? 24 : cadre === "workman" ? 16 : 10,
      hardshipAllowance: cadre === "workman" && i % 7 === 0 ? 1800 : 0,
      locationId,
      unitId: pos.unitId,
      positionId: pos.id,
      status: cadre === "trainee" ? "probation" : "active",
      bankAccount: String(2000000000 + i),
      ifsc: IFSC[locationId],
      pan: panFor(i),
      aadhaar: String(200000000000 + i),
      uan: String(101000000000 + i),
      npsPran: cadre === "workman" ? undefined : String(110100000000 + i),
      assignmentHistory: [
        {
          positionId: pos.id,
          unitId: pos.unitId,
          locationId,
          grade: pay.grade,
          cadre,
          validFrom: `${year}-${pad((i % 12) + 1, 2)}-01`,
        },
      ],
      family: [],
      nominations: [],
      roles: ["employee"],
    } satisfies Employee;
  });
}

export function mergeHeadcount(core: Employee[], namedSeed: Employee[]): Employee[] {
  const extra = generatedEmployees(namedSeed);
  const seen = new Set(core.map((e) => e.id));
  return [...core.filter((e) => !e.id.startsWith("g-")), ...extra.filter((e) => !seen.has(e.id))];
}

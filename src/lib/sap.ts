import type { Employee, SapHrRow } from "./types";

const HEADERS = {
  empNo: ["empno", "emp_no", "employeenumber", "employee_number"],
  name: ["name", "employeename"],
  grade: ["grade"],
  basic: ["basic", "basicpay"],
  unitId: ["unitid", "unit", "department"],
};

function norm(h: string) {
  return h.trim().toLowerCase().replace(/[^a-z0-9]/g, "");
}

function col(header: string[], keys: string[]) {
  const i = header.findIndex((h) => keys.includes(h));
  return i < 0 ? -1 : i;
}

export function parseSapCsv(text: string): { ok: true; rows: SapHrRow[] } | { ok: false; reason: string } {
  const lines = text
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  if (lines.length < 2) return { ok: false, reason: "CSV needs a header and at least one row." };
  const header = lines[0].split(",").map(norm);
  const emp = col(header, HEADERS.empNo);
  const name = col(header, HEADERS.name);
  const grade = col(header, HEADERS.grade);
  const basic = col(header, HEADERS.basic);
  const unit = col(header, HEADERS.unitId);
  if (emp < 0 || grade < 0 || basic < 0) {
    return { ok: false, reason: "Need columns EMPNO, GRADE, BASIC (NAME and UNIT optional)." };
  }
  const rows: SapHrRow[] = [];
  for (const line of lines.slice(1)) {
    const cells = line.split(",").map((c) => c.trim().replace(/^"|"$/g, ""));
    const empNo = cells[emp];
    const basicN = Number(cells[basic]);
    if (!empNo || !Number.isFinite(basicN)) continue;
    rows.push({
      empNo,
      name: name >= 0 ? cells[name] || empNo : empNo,
      grade: cells[grade] || "",
      basic: basicN,
      unitId: unit >= 0 ? cells[unit] || "" : "",
    });
  }
  if (!rows.length) return { ok: false, reason: "No usable rows." };
  return { ok: true, rows };
}

export function nrlExtractCsv(employees: Employee[]) {
  const on = employees.filter((e) => e.cadre !== "contract" && e.status !== "separated");
  const lines = [
    "EMPNO,NAME,GRADE,BASIC,UNIT",
    ...on.map((e) => `${e.empNo},${e.name.replace(/,/g, " ")},${e.grade},${e.basic},${e.unitId}`),
  ];
  return lines.join("\n");
}

export function sapMismatch(employees: Employee[], sapHr: SapHrRow[]) {
  const byEmp = new Map(employees.map((e) => [e.empNo, e]));
  return sapHr.flatMap((s) => {
    const e = byEmp.get(s.empNo);
    if (!e) return [{ s, e: null as Employee | null, issue: "Missing in NRL People" }];
    if (e.grade !== s.grade) return [{ s, e, issue: `Grade SAP ${s.grade} / NRL ${e.grade}` }];
    if (e.basic !== s.basic) return [{ s, e, issue: "Basic differs" }];
    if (s.unitId && e.unitId !== s.unitId) return [{ s, e, issue: `Unit SAP ${s.unitId} / NRL ${e.unitId}` }];
    return [];
  });
}

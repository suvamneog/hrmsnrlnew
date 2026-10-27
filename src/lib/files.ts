import type { Employee, PayResult, StatutoryFile } from "./types";

export function downloadText(name: string, content: string, mime = "text/plain") {
  const blob = new Blob([content], { type: `${mime};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}

function pdfEscape(s: string) {
  return s.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)").replace(/₹/g, "Rs ");
}

export function downloadPdf(name: string, lines: string[]) {
  const leading = lines.map((l) => pdfEscape(l.slice(0, 96)));
  const cmds = ["BT", "/F1 11 Tf", "16 TL", "48 800 Td", ...leading.flatMap((l, i) => (i === 0 ? [`(${l}) Tj`] : [`T* (${l}) Tj`])), "ET"].join("\n");
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>",
    `<< /Length ${cmds.length} >>\nstream\n${cmds}\nendstream`,
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
  ];
  let body = "%PDF-1.4\n";
  const offs = [0];
  objects.forEach((obj, i) => {
    offs.push(body.length);
    body += `${i + 1} 0 obj\n${obj}\nendobj\n`;
  });
  const start = body.length;
  body += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (let i = 1; i < offs.length; i++) body += `${String(offs[i]).padStart(10, "0")} 00000 n \n`;
  body += `trailer << /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${start}\n%%EOF`;
  const blob = new Blob([body], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name.endsWith(".pdf") ? name : `${name}.pdf`;
  a.click();
  URL.revokeObjectURL(url);
}

export function fileMime(kind: StatutoryFile["kind"]) {
  return kind === "ecr" ? "text/plain" : "text/csv";
}

function line(r: PayResult, code: string) {
  return r.lines.find((l) => l.code === code)?.amount ?? 0;
}

function round2(n: number) {
  return Math.round(n * 100) / 100;
}

function csv(fields: (string | number)[]) {
  return fields
    .map((v) => {
      const s = String(v);
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    })
    .join(",");
}

function byId(employees: Employee[]) {
  return new Map(employees.map((e) => [e.id, e]));
}

function yyyymm(month: string) {
  return month.replace("-", "");
}

function dmy(month: string, day = 31) {
  const [y, m] = month.split("-");
  const last = new Date(Number(y), Number(m), 0).getDate();
  return `${String(Math.min(day, last)).padStart(2, "0")}/${m}/${y}`;
}

function sapDate(month: string) {
  const [y, m] = month.split("-");
  const last = new Date(Number(y), Number(m), 0).getDate();
  return `${String(last).padStart(2, "0")}.${m}.${y}`;
}

function fyQuarter(month: string) {
  const [y, m] = month.split("-").map(Number);
  const fyStart = m >= 4 ? y : y - 1;
  const q = m >= 4 ? Math.ceil((m - 3) / 3) : Math.ceil((m + 9) / 3);
  return { fy: `${fyStart}-${String(fyStart + 1).slice(-2)}`, q };
}

const SBI_CLIENT = "NRLCMP";
const SBI_DEBIT = "10888831720";

function sbiCmpRows(
  month: string,
  rows: { ref: string; name: string; account: string; ifsc: string; amount: number; narration: string }[],
) {
  const valueDate = dmy(month);
  return [
    csv([
      "ClientCode",
      "ProductCode",
      "PaymentType",
      "CustRefNo",
      "DebitAccount",
      "ValueDate",
      "Amount",
      "BeneName",
      "BeneAccount",
      "IFSC",
      "BeneBank",
      "Narration",
    ]),
    ...rows.map((r) =>
      csv([
        SBI_CLIENT,
        "NEFT",
        "SAL",
        r.ref,
        SBI_DEBIT,
        valueDate,
        r.amount.toFixed(2),
        r.name.toUpperCase(),
        r.account,
        r.ifsc,
        "STATE BANK OF INDIA",
        r.narration,
      ]),
    ),
  ];
}

export function bankFile(month: string, results: PayResult[], employees: Employee[]): StatutoryFile {
  const map = byId(employees);
  const yyyymmKey = yyyymm(month);
  const rows = results.flatMap((r) => {
    const e = map.get(r.employeeId);
    if (!e?.bankAccount || r.net <= 0) return [];
    return [
      {
        ref: `NRL${yyyymmKey}${e.empNo.replace(/\W/g, "").slice(-8)}`,
        name: e.name,
        account: e.bankAccount,
        ifsc: e.ifsc,
        amount: r.net,
        narration: `SAL ${yyyymmKey} ${e.empNo}`,
      },
    ];
  });
  return {
    kind: "bank",
    name: `SBI_CMP_SALARY_${yyyymmKey}.csv`,
    content: sbiCmpRows(month, rows).join("\n"),
    at: new Date().toISOString(),
  };
}

export function ecrFile(month: string, results: PayResult[], employees: Employee[]): StatutoryFile {
  const map = byId(employees);
  const rows = results.flatMap((r) => {
    const e = map.get(r.employeeId);
    if (!e?.uan) return [];
    const epfWages = round2(line(r, "BASIC") + line(r, "DA"));
    const ee = round2(line(r, "PF"));
    const epsWages = round2(Math.min(epfWages, 15000));
    const edliWages = epsWages;
    const eps = round2(epsWages * 0.0833);
    const erEpf = round2(Math.max(0, (line(r, "PF_ER") || ee) - eps));
    const name = e.name.replace(/[#~]/g, " ").toUpperCase();
    return [`${e.uan}#~#${name}#~#${r.gross.toFixed(2)}#~#${epfWages.toFixed(2)}#~#${epsWages.toFixed(2)}#~#${edliWages.toFixed(2)}#~#${ee.toFixed(2)}#~#${eps.toFixed(2)}#~#${erEpf.toFixed(2)}#~#0#~#0`];
  });
  return {
    kind: "ecr",
    name: `EPFO_ECR_${yyyymm(month)}.txt`,
    content: rows.join("\n"),
    at: new Date().toISOString(),
  };
}

export function npsFile(month: string, results: PayResult[], employees: Employee[]): StatutoryFile {
  const map = byId(employees);
  const [y, m] = month.split("-");
  const rows = [
    csv(["PRAN", "SubscriberName", "PayMonth", "PayYear", "Tier1_Employee", "Tier1_Employer", "Remarks"]),
    ...results.flatMap((r) => {
      const nps = line(r, "NPS");
      if (nps <= 0) return [];
      const e = map.get(r.employeeId);
      if (!e?.npsPran) return [];
      return [csv([e.npsPran, e.name.toUpperCase(), m, y, nps.toFixed(2), nps.toFixed(2), `NRL SAL ${yyyymm(month)}`])];
    }),
  ];
  return { kind: "nps", name: `NPS_SCF_${yyyymm(month)}.csv`, content: rows.join("\n"), at: new Date().toISOString() };
}

export function form24q(month: string, results: PayResult[], employees: Employee[]): StatutoryFile {
  const map = byId(employees);
  const { fy, q } = fyQuarter(month);
  const rows = [
    csv([
      "PAN",
      "NameOfEmployee",
      "EmployeeRef",
      "FY",
      "Quarter",
      "Section",
      "Regime115BAC",
      "GrossSalary",
      "TaxableIncome",
      "TDS",
      "Surcharge",
      "HealthEduCess",
      "TotalTaxDeducted",
    ]),
    ...results.flatMap((r) => {
      const e = map.get(r.employeeId);
      if (!e) return [];
      const tds = round2(line(r, "TDS"));
      return [
        csv([
          e.pan,
          e.name.toUpperCase(),
          e.empNo,
          fy,
          `Q${q}`,
          "192",
          "Y",
          r.gross.toFixed(2),
          r.gross.toFixed(2),
          tds.toFixed(2),
          "0.00",
          "0.00",
          tds.toFixed(2),
        ]),
      ];
    }),
  ];
  return { kind: "tds24q", name: `TRACES_24Q_${fy}_Q${q}_${yyyymm(month)}.csv`, content: rows.join("\n"), at: new Date().toISOString() };
}

const PT_STATE: Record<string, { code: string; file: string }> = {
  numaligarh: { code: "AS", file: "ASSAM_PT" },
  guwahati: { code: "AS", file: "ASSAM_PT" },
  siliguri: { code: "WB", file: "WB_PT" },
  paradip: { code: "OD", file: "ODISHA_PT" },
};

export function ptFiles(month: string, results: PayResult[], employees: Employee[]): StatutoryFile[] {
  const map = byId(employees);
  const groups = new Map<string, string[]>();
  for (const r of results) {
    const e = map.get(r.employeeId);
    if (!e) continue;
    const st = PT_STATE[e.locationId] ?? PT_STATE.numaligarh;
    const rows = groups.get(st.file) ?? [csv(["EMPNO", "NAME", "PAN", "STATE", "GROSS", "PT"])];
    rows.push(csv([e.empNo, e.name.toUpperCase(), e.pan, st.code, r.gross.toFixed(2), round2(line(r, "PT")).toFixed(2)]));
    groups.set(st.file, rows);
  }
  return [...groups.entries()].map(([file, rows]) => ({
    kind: "pt" as const,
    name: `${file}_${yyyymm(month)}.csv`,
    content: rows.join("\n"),
    at: new Date().toISOString(),
  }));
}

export function ptFile(month: string, results: PayResult[], employees: Employee[]): StatutoryFile {
  return ptFiles(month, results, employees)[0] ?? {
    kind: "pt",
    name: `ASSAM_PT_${yyyymm(month)}.csv`,
    content: csv(["EMPNO", "NAME", "PAN", "STATE", "GROSS", "PT"]),
    at: new Date().toISOString(),
  };
}

export function sapFiFile(month: string, results: PayResult[]): StatutoryFile {
  const sum = (code: string) => round2(results.reduce((s, r) => s + line(r, code), 0));
  const gross = round2(results.reduce((s, r) => s + r.gross, 0));
  const net = round2(results.reduce((s, r) => s + r.net, 0));
  const pf = sum("PF");
  const pfEr = sum("PF_ER");
  const nps = sum("NPS");
  const npsEr = sum("NPS_ER");
  const pt = sum("PT");
  const tds = sum("TDS");
  const qlf = sum("QLF");
  const adv = sum("ADV");
  const grat = sum("GRAT_P");
  const prms = sum("PRMS");
  const posting = sapDate(month);
  const ref = `PAY${yyyymm(month)}`;
  const lines: { key: string; gl: string; amount: number; cc: string; text: string }[] = [
    { key: "40", gl: "510100", amount: gross, cc: "HR01", text: `Salary ${month}` },
    { key: "40", gl: "510210", amount: pfEr, cc: "HR01", text: `PF employer ${month}` },
    { key: "40", gl: "510220", amount: npsEr, cc: "HR01", text: `NPS employer ${month}` },
    { key: "40", gl: "510230", amount: grat, cc: "HR01", text: `Gratuity provision ${month}` },
    { key: "40", gl: "510240", amount: prms, cc: "HR01", text: `PRMS ${month}` },
    { key: "50", gl: "160010", amount: net, cc: "", text: "SBI CMP salary payable" },
    { key: "50", gl: "166101", amount: round2(pf + pfEr), cc: "", text: "EPF payable" },
    { key: "50", gl: "166102", amount: round2(nps + npsEr), cc: "", text: "NPS payable" },
    { key: "50", gl: "166103", amount: pt, cc: "", text: "Professional tax payable" },
    { key: "50", gl: "166104", amount: tds, cc: "", text: "TDS 192 payable" },
    { key: "50", gl: "166105", amount: qlf, cc: "", text: "Quarter licence fee" },
    { key: "50", gl: "166106", amount: adv, cc: "", text: "Advance recovery" },
    { key: "50", gl: "166107", amount: grat, cc: "", text: "Gratuity payable" },
    { key: "50", gl: "166108", amount: prms, cc: "", text: "PRMS payable" },
  ].filter((l) => l.amount !== 0);
  const debit = round2(lines.filter((l) => l.key === "40").reduce((s, l) => s + l.amount, 0));
  const credit = round2(lines.filter((l) => l.key === "50").reduce((s, l) => s + l.amount, 0));
  const rows = [
    csv(["BUKRS", "BLART", "BLDAT", "BUDAT", "WAERS", "XBLNR", "BKTXT"]),
    csv(["NRL1", "SA", posting, posting, "INR", ref, `Salary posting ${month}`]),
    "",
    csv(["BUZEI", "BSCHL", "HKONT", "WRBTR", "KOSTL", "SGTXT", "ZUONR"]),
    ...lines.map((l, i) => csv([i + 1, l.key, l.gl, l.amount.toFixed(2), l.cc, l.text, ref])),
    "",
    csv(["BALANCE_OK", debit === credit ? "Y" : "N", "DEBIT", debit.toFixed(2), "CREDIT", credit.toFixed(2)]),
  ];
  return { kind: "sapfi", name: `SAP_FI_BKPF_BSEG_${yyyymm(month)}.csv`, content: rows.join("\n"), at: new Date().toISOString() };
}

export function claimsBankFile(month: string, rows: { empNo: string; name: string; account: string; ifsc: string; amount: number }[]): StatutoryFile {
  const yyyymmKey = yyyymm(month);
  const content = sbiCmpRows(
    month,
    rows.map((r, i) => ({
      ref: `NRLCLM${yyyymmKey}${String(i + 1).padStart(4, "0")}`,
      name: r.name,
      account: r.account,
      ifsc: r.ifsc,
      amount: r.amount,
      narration: `CLAIM ${yyyymmKey} ${r.empNo}`,
    })),
  ).join("\n");
  return { kind: "claims", name: `SBI_CMP_CLAIMS_${yyyymmKey}.csv`, content, at: new Date().toISOString() };
}

export function payslipText(e: Employee, r: PayResult): string {
  const earn = r.lines.filter((l) => l.type === "earning");
  const ded = r.lines.filter((l) => l.type === "deduction");
  const pad = (s: string, n = 28) => s.padEnd(n);
  const amt = (n: number) => n.toFixed(2).padStart(12);
  return [
    "NUMALIGARH REFINERY LIMITED",
    "Payslip  " + r.month,
    `${e.name}  ${e.empNo}  ${e.grade}`,
    "",
    ...earn.map((l) => pad(l.label) + amt(l.amount)),
    pad("Gross") + amt(r.gross),
    "",
    ...ded.map((l) => pad(l.label) + amt(l.amount)),
    pad("Deductions") + amt(r.deductions),
    pad("NET PAY") + amt(r.net),
    "",
    `${e.ifsc}  XXXXXX${e.bankAccount.slice(-4)}`,
  ].join("\n");
}

export function form16Text(e: Employee, r: PayResult): string {
  const tds = line(r, "TDS") * 12;
  return [
    "FORM 16  Part B",
    "Assessment year 2027-28",
    "Numaligarh Refinery Limited  TAN SHLN00000E",
    `${e.name}  PAN ${e.pan}  ${e.empNo}`,
    `Gross salary (annualised)  ${(r.gross * 12).toFixed(2)}`,
    `Tax deducted at source     ${tds.toFixed(2)}`,
  ].join("\n");
}

export function oshReturn(month: string, contractor: { name: string; licenceNo: string }, workers: number, inside: number): string {
  return [
    "OSH Code 2020 — contract labour return",
    `Month ${month}`,
    `Contractor ${contractor.name}`,
    `Licence ${contractor.licenceNo}`,
    `Registered workers ${workers}`,
    `Maximum in plant this month ${inside}`,
  ].join("\n");
}

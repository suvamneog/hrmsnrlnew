"use client";

import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { FileDownload, FileDownloadList } from "@/components/ui/file-download";
import { downloadPdf, form16Text, payslipText, prettySize } from "@/lib/files";
import { inrExact } from "@/lib/format";
import { useHrms } from "@/lib/store";
import { useParams, useSearchParams } from "next/navigation";

export default function PayslipLinePage() {
  const { id } = useParams<{ id: string }>();
  const month = useSearchParams().get("month");
  const run = useHrms((s) => s.payrollRuns.find((r) => r.month === month) ?? s.payrollRuns[0]);
  const e = useHrms((s) => s.employees.find((x) => x.id === id));
  const row = run.results.find((r) => r.employeeId === id);
  if (!e || !row) return <p className="py-10 text-sm text-muted">No payslip for this month yet.</p>;

  const sapByCode = new Map((row.sapLines ?? []).map((l) => [l.code, l.amount]));

  return (
    <div>
      <PageHeader title={e.name} subtitle={`Payslip, ${run.month}, ${e.grade} ${e.cadre}`} />
      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <Card className="p-5">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-muted">
                <th className="py-2">Component</th>
                <th className="py-2 text-right">NRL People</th>
                <th className="py-2 text-right">SAP HR</th>
              </tr>
            </thead>
            <tbody>
              {row.lines
                .filter((l) => l.type !== "employer")
                .map((l) => {
                  const sap = sapByCode.get(l.code);
                  const delta = sap !== undefined ? l.amount - sap : 0;
                  return (
                    <tr key={l.code} className="border-b border-line">
                      <td className="py-2">{l.label}</td>
                      <td className={`py-2 text-right font-medium ${l.type === "deduction" ? "text-danger" : ""}`}>
                        {l.type === "deduction" ? "−" : ""}
                        {inrExact(l.amount)}
                      </td>
                      <td className="py-2 text-right text-muted">
                        {sap === undefined ? "—" : inrExact(sap)}
                        {Math.abs(delta) > 0.5 ? `, Δ ${inrExact(delta)}` : ""}
                      </td>
                    </tr>
                  );
                })}
              <tr>
                <td className="py-3 font-semibold">Net pay</td>
                <td className="py-3 text-right text-lg font-semibold">{inrExact(row.net)}</td>
                <td className="py-3 text-right text-muted">{row.sapNet !== undefined ? inrExact(row.sapNet) : "—"}</td>
              </tr>
            </tbody>
          </table>
        </Card>
        <div className="space-y-3">
          <Card className="px-5 py-2">
            <FileDownloadList>
              <FileDownload
                kind="pdf"
                name="Payslip"
                size={prettySize(payslipText(e, row))}
                onClick={() => downloadPdf(`payslip-${e.empNo}-${row.month}.pdf`, payslipText(e, row).split("\n"))}
              />
              <FileDownload
                kind="pdf"
                name="Form 16"
                size={prettySize(form16Text(e, row))}
                onClick={() => downloadPdf(`form16-${e.empNo}.pdf`, form16Text(e, row).split("\n"))}
              />
            </FileDownloadList>
          </Card>
          <Card className="p-4">
            <p className="text-xs text-muted">Perk ratio vs 35% cap</p>
            <p className="text-2xl font-semibold">{row.perkPct.toFixed(1)}%</p>
          </Card>
          <Card className="p-4">
            <p className="text-xs text-muted">Superannuation vs 30% cap</p>
            <p className="text-2xl font-semibold">{row.superPct.toFixed(1)}%</p>
          </Card>
          <Card className="p-4">
            <p className="text-xs text-muted">Wage share (Labour Codes)</p>
            <p className="text-2xl font-semibold">{(row.wageShare * 100).toFixed(1)}%</p>
          </Card>
          {row.arrears ? (
            <Card className="p-4">
              <p className="text-xs text-muted">Arrears this run</p>
              <p className="text-lg font-semibold">{inrExact(row.arrears)}</p>
            </Card>
          ) : null}
          {row.flags.map((f) => (
            <Badge key={f.code} tone={f.severity === "block" ? "danger" : "warn"}>
              {f.message}
            </Badge>
          ))}
        </div>
      </div>
    </div>
  );
}

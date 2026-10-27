"use client";

import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { canAdvancePayroll } from "@/lib/access";
import { downloadText, fileMime } from "@/lib/files";
import { inr } from "@/lib/format";
import { PAYROLL_STAGES } from "@/lib/payroll";
import { useHrms } from "@/lib/store";
import { motion } from "motion/react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { toast } from "sonner";

const PAGE = 40;

export default function PayrollPage() {
  const run = useHrms((s) => s.payrollRuns[0]);
  const employees = useHrms((s) => s.employees);
  const role = useHrms((s) => s.actingRole);
  const lock = useHrms((s) => s.lockAttendance);
  const compute = useHrms((s) => s.computePayroll);
  const advance = useHrms((s) => s.advancePayroll);
  const generateFiles = useHrms((s) => s.generateFiles);
  const [page, setPage] = useState(0);
  const idx = PAYROLL_STAGES.findIndex((s) => s.id === run.stage);
  const byId = useMemo(() => new Map(employees.map((e) => [e.id, e])), [employees]);
  const ordered = useMemo(() => {
    const named = run.results.filter((r) => !r.employeeId.startsWith("g-"));
    const rest = run.results.filter((r) => r.employeeId.startsWith("g-"));
    return [...named, ...rest];
  }, [run.results]);
  const pages = Math.max(1, Math.ceil(ordered.length / PAGE));
  const slice = ordered.slice(page * PAGE, page * PAGE + PAGE);
  const payable = employees.filter((e) => (e.status === "active" || e.status === "probation") && e.cadre !== "contract").length;
  const employeesInRun = run.totals?.employees ?? run.results.length;
  const totalNet = run.totals?.net ?? run.results.reduce((s, r) => s + r.net, 0);
  const sapDiff = run.totals?.sapDiffs ?? run.results.filter((r) => r.sapNet && Math.abs(r.sapNet - r.net) > 1).length;
  const blockers = run.totals?.blockers ?? run.results.filter((r) => r.flags.some((f) => f.severity === "block")).length;

  return (
    <div>
      <PageHeader
        title="October 2026 payroll"
        subtitle="Lock attendance, then compute. Each later stage locks the one before. Finance, not payroll, releases the bank file."
        actions={
          <div className="flex gap-2">
            {!run.lockedAttendance && (
              <Button variant="secondary" onClick={() => { lock(run.id); toast.success("Attendance locked"); }}>
                Lock attendance
              </Button>
            )}
            {run.stage === "inputs" && (
              <Button
                disabled={!run.lockedAttendance}
                onClick={() => {
                  const r = compute(run.id);
                  if (!r.ok) {
                    toast.error(r.reason);
                    return;
                  }
                  const t = useHrms.getState().payrollRuns.find((x) => x.id === run.id)?.totals;
                  toast.success(t ? `Computed ${t.employees.toLocaleString("en-IN")} people in ${t.ms} ms` : "Computed");
                  setPage(0);
                }}
              >
                {run.lockedAttendance ? "Compute" : "Lock first"}
              </Button>
            )}
            {run.stage !== "inputs" && run.stage !== "publish" && (
              <Button
                disabled={!canAdvancePayroll(role, run.stage)}
                onClick={() => {
                  const r = advance(run.id);
                  if (!r.ok) toast.error(r.reason);
                  else toast.success("Moved to next stage");
                }}
              >
                {role !== "finance_approver" && run.stage === "finance_approval" ? "Needs finance" : "Advance"}
              </Button>
            )}
            {run.results.length > 0 && (
              <Button
                variant="secondary"
                onClick={() => {
                  const files = generateFiles(run.id);
                  files.forEach((f) => downloadText(f.name, f.content, fileMime(f.kind)));
                  toast.success(`${files.length} statutory files downloaded`);
                }}
              >
                Bank / ECR / 24Q
              </Button>
            )}
          </div>
        }
      />

      <div className="mb-6 flex gap-2 overflow-x-auto pb-2">
        {PAYROLL_STAGES.map((s, i) => (
          <div key={s.id} className="min-w-[140px] flex-1">
            <div className="mb-2 h-1.5 overflow-hidden rounded-full bg-brand-soft">
              <motion.div
                className="h-full bg-brand"
                initial={{ width: 0 }}
                animate={{ width: i < idx ? "100%" : i === idx ? "55%" : "0%" }}
                transition={{ duration: 0.4 }}
              />
            </div>
            <p className={`text-xs font-semibold ${i <= idx ? "text-ink" : "text-muted"}`}>{s.label}</p>
          </div>
        ))}
      </div>

      <div className="mb-5 grid gap-3 sm:grid-cols-3">
        <Card className="p-4">
          <p className="text-xs text-muted">Employees in run</p>
          <p className="text-2xl font-semibold">{employeesInRun || payable}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-muted">Net pay</p>
          <p className="text-2xl font-semibold">{run.results.length ? inr(totalNet) : "—"}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-muted">SAP parallel differences</p>
          <p className="text-2xl font-semibold">{sapDiff}</p>
          {run.totals?.ms != null && <p className="mt-1 text-[11px] text-muted">Computed in {run.totals.ms} ms</p>}
        </Card>
      </div>

      {run.results.length === 0 && (
        <Card className="p-8 text-center text-sm text-muted">
          {run.lockedAttendance
            ? "Attendance is locked. Compute reads DA, HRA, DPE caps and the wage-share test from dated settings."
            : "Lock attendance before compute. The engine will not run on an open month."}
        </Card>
      )}

      {run.results.length > 0 && (
        <Card className="overflow-x-auto">
          <table className="min-w-[720px] w-full text-sm">
            <thead className="bg-[#f6f8fd] text-left text-xs text-muted">
              <tr>
                <th className="px-4 py-3">Employee</th>
                <th>Cadre</th>
                <th className="text-right">Gross</th>
                <th className="text-right">Net</th>
                <th className="text-right">Wage share</th>
                <th className="px-4">Flags</th>
              </tr>
            </thead>
            <tbody>
              {slice.map((r) => {
                const e = byId.get(r.employeeId);
                if (!e) return null;
                return (
                  <tr key={r.employeeId} className="border-t border-line">
                    <td className="px-4 py-3">
                      <Link href={`/payroll/${r.employeeId}`} className="font-semibold text-brand">
                        {e.name}
                      </Link>
                      <p className="text-xs text-muted">{e.empNo}</p>
                    </td>
                    <td>{e.grade}</td>
                    <td className="text-right">{inr(r.gross)}</td>
                    <td className="text-right font-semibold">{inr(r.net)}</td>
                    <td className="text-right">{(r.wageShare * 100).toFixed(0)}%</td>
                    <td className="px-4">
                      {r.flags.length === 0 ? (
                        <Badge tone="ok">clear</Badge>
                      ) : (
                        <Badge tone={r.flags.some((f) => f.code === "negative_net" || f.code === "missing_bank") ? "danger" : "warn"}>
                          {r.flags.length} checks
                        </Badge>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div className="flex items-center justify-between border-t border-line px-4 py-3 text-xs text-muted">
            <p>
              {page * PAGE + 1}–{Math.min((page + 1) * PAGE, ordered.length)} of {ordered.length.toLocaleString("en-IN")} · named first
            </p>
            <div className="flex gap-2">
              <button disabled={page === 0} className="font-semibold disabled:opacity-40" onClick={() => setPage((p) => p - 1)}>
                Previous
              </button>
              <button disabled={page + 1 >= pages} className="font-semibold disabled:opacity-40" onClick={() => setPage((p) => p + 1)}>
                Next
              </button>
            </div>
          </div>
        </Card>
      )}
      {blockers > 0 && (
        <p className="mt-3 text-sm text-muted">{blockers} rows fail DPE 35/30/50, bank or net-pay checks. Finance cannot release until they clear.</p>
      )}
      {(run.files ?? []).length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {run.files!.map((f) => (
            <button
              key={f.kind}
              className="rounded-full bg-white px-3 py-1.5 text-xs font-semibold"
              onClick={() => downloadText(f.name, f.content, fileMime(f.kind))}
            >
              {f.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

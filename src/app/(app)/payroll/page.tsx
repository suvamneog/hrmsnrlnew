"use client";

import { PayrollCharts } from "@/components/charts/page-charts";

import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FileDownload, FileDownloadList, fileKindFromName } from "@/components/ui/file-download";
import { HoldToConfirm } from "@/components/ui/hold-to-confirm";
import { canAdvancePayroll } from "@/lib/access";
import { downloadText, fileMime, prettySize } from "@/lib/files";
import { inr } from "@/lib/format";
import { easeOut } from "@/lib/motion";
import { PAYROLL_STAGES } from "@/lib/payroll";
import { useHrms } from "@/lib/store";
import { motion } from "motion/react";
import Link from "next/link";

import { useMemo, useState } from "react";
import { toast } from "sonner";

const PAGE = 40;

// Statutory outputs grouped the way the payroll cell hands them off.

function statutoryTitle(name: string) {
  return name.replace(/\.[^.]+$/, "").replaceAll("_", " ");
}

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
  const released = run.stage === "bank_file" || run.stage === "publish";
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
        subtitle="All NRL locations: Numaligarh, Siliguri, Paradip and Guwahati, with professional tax per state."
        actions={
          <div className="flex gap-2">
            {!run.lockedAttendance && (role === "payroll_officer" || role === "hr_admin") && (
              <Button variant="secondary" onClick={() => { lock(run.id); toast.success("Attendance locked"); }}>
                Lock attendance
              </Button>
            )}
            {run.stage === "inputs" && (role === "payroll_officer" || role === "hr_admin") && (
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
                {run.lockedAttendance ? "Compute" : "Compute (lock first)"}
              </Button>
            )}
            {run.stage !== "inputs" && run.stage !== "publish" && run.stage === "finance_approval" && role === "finance_approver" ? (
              <HoldToConfirm
                label="Hold to release bank file"
                doneLabel="Released"
                onConfirm={() => {
                  const r = advance(run.id);
                  if (!r.ok) toast.error(r.reason);
                  else toast.success("Bank file released");
                }}
              />
            ) : run.stage !== "inputs" && run.stage !== "publish" ? (
              <Button
                disabled={!canAdvancePayroll(role, run.stage)}
                onClick={() => {
                  const r = advance(run.id);
                  if (!r.ok) toast.error(r.reason);
                  else toast.success(`Moved to ${PAYROLL_STAGES[idx + 1]?.label.toLowerCase() ?? "the next step"}`);
                }}
              >
                {role !== "finance_approver" && run.stage === "finance_approval" ? "Waiting on finance" : PAYROLL_STAGES[idx + 1] ? `Move to ${PAYROLL_STAGES[idx + 1].label.toLowerCase()}` : "Done"}
              </Button>
            ) : null}
            {run.stage === "validate" && (role === "payroll_officer" || role === "hr_admin") && (
              <Button
                variant="secondary"
                onClick={() => {
                  const r = compute(run.id);
                  if (!r.ok) toast.error(r.reason);
                  else toast.success("Recomputed with the latest records");
                }}
              >
                Recompute
              </Button>
            )}
            {released && !run.files?.length && (role === "payroll_officer" || role === "finance_approver") && (
              <Button
                variant="secondary"
                onClick={() => {
                  generateFiles(run.id);
                  toast.success("Statutory files ready");
                }}
              >
                Bank / ECR / 24Q files
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
                className="h-full w-full origin-left bg-brand"
                initial={{ scaleX: 0 }}
                animate={{ scaleX: i < idx ? 1 : i === idx ? 0.55 : 0 }}
                transition={{ duration: 0.5, ease: easeOut }}
              />
            </div>
            <p className={`text-xs font-semibold ${i <= idx ? "text-ink" : "text-muted"}`}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Where the run stands and what to do next, said in one line right under the steps. */}
      <p className="-mt-3 mb-5 text-[13px] text-muted">
        <span className="font-semibold text-ink">
          {run.lockedAttendance || run.results.length
            ? `Step ${idx + 1} of ${PAYROLL_STAGES.length}: ${PAYROLL_STAGES[idx]?.label}.`
            : `Step 1 of ${PAYROLL_STAGES.length}: ${PAYROLL_STAGES[0].label}.`}
        </span>{" "}
        {run.results.length
          ? "Check the pay register below, then move the run on."
          : run.lockedAttendance
            ? "Attendance is locked. Compute the run next."
            : "Lock attendance first: it freezes this month's attendance, leave and overtime so pay is computed on final figures."}
      </p>

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
          <Link href="/interfaces" className="mt-2 inline-block text-xs font-semibold text-brand">
            SAP HR interface
          </Link>
        </Card>
      </div>

      <PayrollCharts />


      {run.results.length > 0 && (
        <Card className="overflow-x-auto">
          <table className="min-w-[720px] w-full text-sm">
            <thead className="bg-subtle text-left text-xs text-muted">
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
              {page * PAGE + 1}–{Math.min((page + 1) * PAGE, ordered.length)} of {ordered.length.toLocaleString("en-IN")}
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
        <Card className="mt-5 px-5 py-2">
          <FileDownloadList>
            {run.files!.map((f) => (
              <FileDownload
                key={f.name}
                kind={fileKindFromName(f.name)}
                name={statutoryTitle(f.name)}
                size={prettySize(f.content)}
                onClick={() => downloadText(f.name, f.content, fileMime(f.kind))}
              />
            ))}
          </FileDownloadList>
        </Card>
      )}
    </div>
  );
}

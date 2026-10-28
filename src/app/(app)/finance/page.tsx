"use client";

import { C, ChartCard, HBars } from "@/components/charts/kit";
import { Grid2, Panel, Pill, Rows, Stats } from "@/components/desk/kit";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useDesk } from "@/lib/desk";
import { costByUnit } from "@/lib/desk-analytics";
import { formatStamp, inr, monthLabel } from "@/lib/format";
import { useCurrentUser, useHrms } from "@/lib/store";
import { useMemo, useState } from "react";
import { toast } from "sonner";

const lakh = (n: number) => (n >= 1e7 ? `₹${(n / 1e7).toFixed(2)} Cr` : `₹${(n / 1e5).toFixed(1)}L`);

const SERIES = [
  { key: "gross", label: "Gross pay", color: C.blue },
  { key: "employer", label: "Employer cost", color: C.sky },
];

/* Pay cost by unit, exceptions Finance clears line by line, and who approved what. */
export default function FinancePage() {
  const me = useCurrentUser();
  const role = useHrms((s) => s.actingRole);
  const runs = useHrms((s) => s.payrollRuns);
  const employees = useHrms((s) => s.employees);
  const audit = useHrms((s) => s.audit);
  const cleared = useDesk((s) => s.cleared);
  const clear = useDesk((s) => s.clearException);
  const [reason, setReason] = useState<Record<string, string>>({});

  const run = runs.find((r) => r.results.length) ?? runs[0];
  const units = useMemo(() => (run ? costByUnit(run, employees) : []), [run, employees]);
  if (!me || !run) return null;

  const canClear = role === "finance_approver";
  const name = (id: string) => employees.find((e) => e.id === id)?.name ?? id;
  const exceptions = run.results.flatMap((r) => r.flags.map((f) => ({ id: `${run.id}:${r.employeeId}:${f.code}`, employeeId: r.employeeId, ...f })));
  const open = exceptions.filter((x) => !cleared[x.id]);
  const gross = units.reduce((n, u) => n + u.gross, 0);
  const employer = units.reduce((n, u) => n + u.employer, 0);
  const trail = audit.filter((a) => a.source === "payroll" && a.object.startsWith(run.id)).slice(0, 8);
  const makers = new Set(trail.filter((a) => a.action === "compute_payroll").map((a) => a.actorId));
  const checkers = new Set(trail.filter((a) => a.action === "advance_payroll" && a.object.endsWith("bank_file")).map((a) => a.actorId));
  const dual = checkers.size > 0 && [...checkers].every((c) => !makers.has(c));
  const deductions = run.results
    .map((r) => ({ id: r.employeeId, total: r.deductions, lines: r.lines.filter((l) => l.type === "deduction" && l.amount > 0) }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 8);

  return (
    <div className="space-y-6">
      <PageHeader title="Pay cost" subtitle={`${monthLabel(run.month)} run: where the money goes, and what Finance has cleared.`} />

      <Stats
        items={[
          { label: "Gross pay", value: lakh(gross) },
          { label: "Employer cost", value: lakh(employer), hint: "PF, NPS and gratuity share" },
          { label: "Exceptions open", value: open.length, tone: open.length ? "warn" : "ok", hint: `${exceptions.length - open.length} cleared` },
          { label: "Maker and checker", value: dual ? "Separate" : checkers.size ? "Same person" : "Not yet approved", tone: dual ? "ok" : checkers.size ? "danger" : "ink" },
        ]}
      />

      <ChartCard title="Cost by unit" note="Budget lines are not loaded in the demo, so this shows actuals only." series={SERIES}>
        <HBars data={units} y="unit" labelWidth={150} format={lakh} series={SERIES} />
      </ChartCard>

      <Grid2>
        <Panel title="Exceptions" note="Clear each line with a reason. Blocking lines hold the bank file.">
          <Rows
            items={exceptions}
            empty="No exceptions in this run."
            render={(x) => {
              const done = cleared[x.id];
              return (
                <div className="w-full">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-ink">{name(x.employeeId)}</p>
                      <p className="text-[12px] text-muted">{x.message}</p>
                    </div>
                    {done ? <Pill tone="ok">Cleared</Pill> : <Pill tone={x.severity === "block" ? "danger" : "warn"}>{x.severity === "block" ? "Blocks run" : "Warning"}</Pill>}
                  </div>
                  {done ? (
                    <p className="mt-1.5 text-[12px] text-muted">
                      {name(done.by)}, {formatStamp(done.at)}: {done.reason}
                    </p>
                  ) : (
                    canClear && (
                      <form
                        className="mt-2.5 flex flex-wrap gap-2"
                        onSubmit={(e) => {
                          e.preventDefault();
                          const r = (reason[x.id] ?? "").trim();
                          if (r.length < 6) return toast.error("Give a reason Finance can stand behind.");
                          clear(x.id, me.id, r);
                          toast.success("Line cleared");
                        }}
                      >
                        <Input className="h-9 min-w-0 flex-1" placeholder="Reason" value={reason[x.id] ?? ""} onChange={(e) => setReason({ ...reason, [x.id]: e.target.value })} />
                        <Button type="submit" className="h-9">
                          Clear
                        </Button>
                      </form>
                    )
                  )}
                </div>
              );
            }}
          />
        </Panel>

        <Panel title="Approval trail" note="Who computed the run and who released the bank file.">
          <Rows
            items={trail}
            empty="No payroll actions recorded for this run yet."
            render={(a) => (
              <>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-ink">{name(a.actorId)}</p>
                  <p className="text-[12px] text-muted">{formatStamp(a.at)}</p>
                </div>
                <Pill tone={a.action === "compute_payroll" ? "muted" : "brand"}>
                  {a.action === "compute_payroll" ? "Computed" : `Moved to ${a.object.split(":")[1]?.replace("_", " ")}`}
                </Pill>
              </>
            )}
          />
          <p className="mt-4 text-[12px] text-muted">SBI acknowledgement is simulated. A live build reads the bank&apos;s return file.</p>
        </Panel>
      </Grid2>

      <Panel title="Largest deductions" note="Recoveries per employee, for audit.">
        <Rows
          items={deductions}
          empty="No deductions."
          render={(d) => (
            <>
              <div className="min-w-0">
                <p className="text-sm font-medium text-ink">{name(d.id)}</p>
                <p className="truncate text-[12px] text-muted">{d.lines.map((l) => `${l.label} ${inr(l.amount)}`).join(", ")}</p>
              </div>
              <span className="text-sm font-semibold tabular-nums text-ink">{inr(d.total)}</span>
            </>
          )}
        />
      </Panel>
    </div>
  );
}

"use client";

import { Bars, C, ChartCard } from "@/components/charts/kit";
import { PayrollCharts, SafetyCharts } from "@/components/charts/page-charts";
import { Grid2, Panel, Pill, Stats } from "@/components/desk/kit";
import { DashboardCharts } from "@/components/home/dashboard-charts";
import { PageHeader } from "@/components/layout/page-header";
import { liveCensus } from "@/lib/census";
import { DEMO_TODAY } from "@/lib/demo";
import { overtimeByDay } from "@/lib/desk-analytics";
import { insideNow } from "@/lib/gate";
import { useHrms } from "@/lib/store";
import Link from "next/link";
import { useMemo } from "react";

const lakh = (n: number) => (n >= 1e7 ? `₹${(n / 1e7).toFixed(2)} Cr` : `₹${(n / 1e5).toFixed(1)}L`);

const REPORTS = [
  { name: "Cadre strength", for: "DPE annual return", href: "/reports" },
  { name: "Reservation roster", for: "Ministry of Petroleum and Natural Gas", href: "/reports" },
  { name: "Women and PwBD", for: "Board report", href: "/reports" },
  { name: "Contract labour", for: "CLRA half-yearly return", href: "/reports" },
];

/* The MD's single read-only page: people, plant, pay and safety, with nothing to approve. */
export default function MdPage() {
  const employees = useHrms((s) => s.employees);
  const attendance = useHrms((s) => s.attendance);
  const settings = useHrms((s) => s.settings);
  const events = useHrms((s) => s.gateEvents);
  const passes = useHrms((s) => s.passes);
  const certs = useHrms((s) => s.certificates);
  const runs = useHrms((s) => s.payrollRuns);

  const census = liveCensus(employees);
  const ot = useMemo(() => overtimeByDay(attendance, employees, settings), [attendance, employees, settings]);
  const otCost = ot.reduce((n, r) => n + r.cost, 0);
  const today = attendance.filter((a) => a.date === DEMO_TODAY);
  const present = today.filter((a) => a.status === "present").length;
  const run = runs.find((r) => r.results.length) ?? runs[0];
  const net = run?.results.reduce((n, r) => n + r.net, 0) ?? 0;
  const expired = certs.filter((c) => c.expires < DEMO_TODAY).length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Plant and people overview"
        subtitle="Headcount, attendance, gate, overtime, pay and safety in one place."
        actions={<Pill tone="brand">Read only</Pill>}
      />

      <Stats
        items={[
          { label: "On roll", value: census.onRoll, hint: "Demo sample. NRL publishes 1,120." },
          { label: "Inside the plant now", value: insideNow(events, passes).size, hint: "Contract workers on gate passes" },
          { label: "Present today", value: `${present} of ${today.length}`, hint: "Staff on the biometric roster" },
          { label: "Certificates expired", value: expired, tone: expired ? "danger" : "ok", hint: "Holders are blocked at the gate" },
        ]}
      />

      <DashboardCharts force />

      <Grid2>
        <ChartCard
          title="Overtime paid to workmen each day, last 14 days"
          value={lakh(otCost)}
          note={(() => { const top = [...ot].sort((a, b) => b.cost - a.cost)[0]; return top ? `Highest on ${top.day} at ${lakh(top.cost)}. Priced at the workmen overtime rate in the rules engine.` : "No overtime in the last 14 days."; })()}
          series={[{ key: "cost", label: "Cost", color: C.blue }]}
        >
          <Bars data={ot} x="day" format={lakh} unit="Rupees" xUnit="Day" series={[{ key: "cost", label: "Cost", color: C.blue }]} />
        </ChartCard>
        <Panel title="Net pay, latest run" note={run ? `${run.month} run, ${run.results.length.toLocaleString("en-IN")} employees.` : undefined}>
          <p className="text-[34px] font-semibold leading-none tracking-[-0.03em] tabular-nums">{lakh(net)}</p>
          <p className="mt-6 text-[13px] text-muted">Government reports this month</p>
          <ul className="mt-2 divide-y divide-fill">
            {REPORTS.map((r) => (
              <li key={r.name} className="flex items-center justify-between gap-3 py-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-ink">{r.name}</p>
                  <p className="text-[12px] text-muted">{r.for}</p>
                </div>
                <Link href={r.href} className="shrink-0 text-[13px] font-semibold text-brand hover:underline">
                  Open
                </Link>
              </li>
            ))}
          </ul>
        </Panel>
      </Grid2>

      <PayrollCharts />
      <SafetyCharts />
    </div>
  );
}

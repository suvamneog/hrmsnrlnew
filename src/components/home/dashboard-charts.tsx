"use client";

import { Areas, Bars, C, ChartCard } from "@/components/charts/kit";
import { attendanceMix, crewCoverage, gateByHour } from "@/lib/analytics";
import { useHrms } from "@/lib/store";
import { useMemo } from "react";

// Shown to HR admin and auditor only: plant-wide attendance, crew manning and gate flow.
const MIN_MANNING = 3;

export function DashboardCharts() {
  const role = useHrms((s) => s.actingRole);
  const attendance = useHrms((s) => s.attendance);
  const punches = useHrms((s) => s.punches);
  const shifts = useHrms((s) => s.shifts);
  const employees = useHrms((s) => s.employees);
  const roster = useHrms((s) => s.roster);
  const events = useHrms((s) => s.gateEvents);
  const mix = useMemo(() => attendanceMix(attendance, punches, shifts), [attendance, punches, shifts]);
  const crews = useMemo(() => crewCoverage(employees, roster, attendance, punches), [employees, roster, attendance, punches]);
  const gate = useMemo(() => gateByHour(events), [events]);
  if (role !== "hr_admin" && role !== "auditor") return null;

  const last = mix.at(-1);
  const short = crews.filter((c) => c.actual < MIN_MANNING && c.planned > 0).length;
  return (
    <div className="grid gap-5 *:min-w-0 xl:grid-cols-2">
      <ChartCard
        className="xl:col-span-2"
        eyebrow="Attendance"
        title={`Last ${mix.length} days`}
        value={last ? `${last.present + last.late} in today` : "—"}
        note="Staff on the biometric roster. Hover a day for the split."
        series={[
          { key: "present", label: "On time", color: C.green },
          { key: "late", label: "Late", color: C.amber },
          { key: "absent", label: "Missing punch", color: C.red },
          { key: "leave", label: "On leave", color: C.sky },
        ]}
      >
        <Bars
          data={mix}
          x="day"
          series={[
            { key: "present", label: "On time", color: C.green },
            { key: "late", label: "Late", color: C.amber },
            { key: "absent", label: "Missing punch", color: C.red },
            { key: "leave", label: "On leave", color: C.sky },
          ]}
        />
      </ChartCard>
      <ChartCard
        eyebrow="Shift coverage"
        title="Planned against actual, today"
        value={short ? `${short} crew below minimum` : "All crews manned"}
        note={`Minimum manning ${MIN_MANNING} per crew (demo value, to confirm with NRL)`}
        series={[
          { key: "planned", label: "Planned", color: C.slate },
          { key: "actual", label: "Actual", color: C.blue },
        ]}
      >
        <Bars
          data={crews}
          x="crew"
          stacked={false}
          threshold={{ value: MIN_MANNING, label: "Minimum" }}
          highlight={{ key: "actual", when: (r) => Number(r.actual) < MIN_MANNING && Number(r.planned) > 0, color: C.red }}
          series={[
            { key: "planned", label: "Planned", color: C.slate },
            { key: "actual", label: "Actual", color: C.blue },
          ]}
          labelFormat={(l, row) => `${l} · ${row?.shift === "OFF" ? "off today" : `${row?.shift} shift`}`}
        />
      </ChartCard>
      <ChartCard
        eyebrow="Gates"
        title="In and out by hour, today"
        value={`${gate.reduce((n, g) => n + g.in, 0)} entries`}
        note="Contract workers at Gates 1–3."
        series={[
          { key: "in", label: "In", color: C.green },
          { key: "out", label: "Out", color: C.violet },
        ]}
      >
        <Areas
          data={gate}
          x="hour"
          series={[
            { key: "in", label: "In", color: C.green },
            { key: "out", label: "Out", color: C.violet },
          ]}
        />
      </ChartCard>
    </div>
  );
}

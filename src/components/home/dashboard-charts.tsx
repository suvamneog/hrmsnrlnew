"use client";

import { Areas, Bars, C, ChartCard } from "@/components/charts/kit";
import { attendanceMix, crewCoverage, gateByHour } from "@/lib/analytics";
import { useCrewScope } from "@/lib/crew-scope";
import { useHrms } from "@/lib/store";
import { useMemo } from "react";

// Shown to HR admin and auditor only: plant-wide attendance, crew manning and gate flow.
export const MIN_MANNING = 3;

export type HomeChart = "attendance" | "crews" | "gate";

/* MD overview shows all three; Home shows only the one chart that matters to the role (`only`). */
export function DashboardCharts({ force, only }: { force?: boolean; only?: HomeChart } = {}) {
  const role = useHrms((s) => s.actingRole);
  const attendance = useHrms((s) => s.attendance);
  const punches = useHrms((s) => s.punches);
  const shifts = useHrms((s) => s.shifts);
  const employees = useHrms((s) => s.employees);
  const roster = useHrms((s) => s.roster);
  const { events } = useCrewScope();
  const mix = useMemo(() => attendanceMix(attendance, punches, shifts), [attendance, punches, shifts]);
  const crews = useMemo(() => crewCoverage(employees, roster, attendance, punches), [employees, roster, attendance, punches]);
  const gate = useMemo(() => gateByHour(events), [events]);
  if (!force && !only && role !== "hr_admin" && role !== "auditor") return null;
  const want = (k: HomeChart) => !only || only === k;

  const last = mix.at(-1);
  const short = crews.filter((c) => c.actual < MIN_MANNING && c.planned > 0).length;
  return (
    <div className={only ? "grid gap-5 *:min-w-0" : "grid gap-5 *:min-w-0 xl:grid-cols-2"}>
      {want("attendance") && (
      <ChartCard
        className={only ? undefined : "xl:col-span-2"}
        title={`NRL staff attendance, last ${mix.length} days`}
        value={last ? `${last.present + last.late} in today` : "—"}
        note={!last ? "NRL staff who check in at the gate." : last.late + last.absent ? `${last.late} came in late and ${last.absent} have not come in today. Speak to them before this month's attendance is locked for pay.` : "Everyone on today's roster came in on time."}
        series={[
          { key: "present", label: "On time", color: C.green },
          { key: "late", label: "Late", color: C.amber },
          { key: "absent", label: "No check-in", color: C.red },
          { key: "leave", label: "On leave", color: C.sky },
        ]}
      >
        <Bars
          data={mix}
          x="day"
          series={[
            { key: "present", label: "On time", color: C.green },
            { key: "late", label: "Late", color: C.amber },
            { key: "absent", label: "No check-in", color: C.red },
            { key: "leave", label: "On leave", color: C.sky },
          ]}
          unit="People"
          xUnit="Day"
        />
      </ChartCard>
      )}
      {want("crews") && (
      <ChartCard
        title="Crew manning today: rostered against present"
        value={short ? `${short} crew below minimum` : "All crews manned"}
        note={short ? `${crews.filter((c) => c.actual < MIN_MANNING && c.planned > 0).map((c) => c.crew).join(", ")} below the minimum of ${MIN_MANNING} (demo value, to confirm with NRL). Call in relief.` : `Every crew meets the minimum of ${MIN_MANNING} (demo value, to confirm with NRL).`}
        series={[
          { key: "planned", label: "Rostered", color: C.slate },
          { key: "actual", label: "Present", color: C.blue },
        ]}
      >
        <Bars
          data={crews}
          x="crew"
          stacked={false}
          unit="People"
          xUnit="Crew"
          threshold={{ value: MIN_MANNING, label: "Minimum" }}
          highlight={{ key: "actual", when: (r) => Number(r.actual) < MIN_MANNING && Number(r.planned) > 0, color: C.red }}
          series={[
            { key: "planned", label: "Rostered", color: C.slate },
            { key: "actual", label: "Present", color: C.blue },
          ]}
          labelFormat={(l, row) => `${l}, ${row?.shift === "OFF" ? "off today" : `${row?.shift} shift`}`}
        />
      </ChartCard>
      )}
      {want("gate") && (
      <ChartCard
        title="Contract workers entering and leaving by hour, today"
        value={`${gate.reduce((n, g) => n + g.in, 0)} entries`}
        note={(() => { const p = [...gate].sort((a, b) => Number(b.in) - Number(a.in))[0]; return p ? `Busiest at ${p.hour}, when ${p.in} came in. Keep all turnstiles open then.` : "Contract workers at Gates 1 to 3."; })()}
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
          unit="Workers"
          xUnit="Hour of day"
        />
      </ChartCard>
      )}
    </div>
  );
}

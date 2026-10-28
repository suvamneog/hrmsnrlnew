"use client";

import { Areas, Bars, C, ChartCard, Donut, HBars, Heatmap, Timeline } from "@/components/charts/kit";
import {
  ATTRITION_SAMPLE,
  ATTRITION_UNITS_SAMPLE,
  attendanceByShift,
  blockedByReason,
  certExpiryByCourse,
  contractorLoad,
  expiryWindows,
  headcountByLocation,
  inPlantByHour,
  leaveByType,
  payrollComponents,
  punchTimeline,
  reservationStatus,
  rosterGrid,
  townshipRecovery,
} from "@/lib/analytics";
import { liveCensus } from "@/lib/census";
import { DEMO_TODAY } from "@/lib/demo";
import { inr } from "@/lib/format";
import { settingOn } from "@/lib/payroll";
import { useCrewScope } from "@/lib/crew-scope";
import { useCurrentUser, useHrms } from "@/lib/store";
import { format, parseISO } from "date-fns";
import Link from "next/link";
import { useMemo } from "react";

const Grid = ({ children }: { children: React.ReactNode }) => <div className="mb-6 grid gap-5 *:min-w-0 xl:grid-cols-2">{children}</div>;
const lakh = (n: number) => (n >= 1e7 ? `₹${(n / 1e7).toFixed(2)} Cr` : `₹${(n / 1e5).toFixed(1)}L`);

// Shifts need four colours that stay apart in a stack: two blues, ink and a mid grey.
const SHIFT_COLOR: Record<string, string> = { M: "#3d5afe", A: "#8a9bff", N: "#1d1d1f", G: "#8e8e93", OFF: "#f2f2f0" };
const SHIFT_SERIES = [
  { key: "M", label: "Morning, 06:00 to 14:00", color: SHIFT_COLOR.M },
  { key: "A", label: "Afternoon, 14:00 to 22:00", color: SHIFT_COLOR.A },
  { key: "N", label: "Night, 22:00 to 06:00", color: SHIFT_COLOR.N },
  { key: "G", label: "General, 09:00 to 17:30", color: SHIFT_COLOR.G },
];

/* Attendance: heads present per shift each day, and my punches against my roster. */
export function TimeCharts() {
  const me = useCurrentUser();
  const attendance = useHrms((s) => s.attendance);
  const roster = useHrms((s) => s.roster);
  const shifts = useHrms((s) => s.shifts);
  const punches = useHrms((s) => s.punches);
  const byShift = useMemo(() => attendanceByShift(attendance), [attendance]);
  const timeline = useMemo(() => (me ? punchTimeline(me.id, roster, shifts, punches, attendance) : []), [me, roster, shifts, punches, attendance]);
  if (!me) return null;
  const series = SHIFT_SERIES;
  const flagged = timeline.filter((t) => t.flag);
  const flags = flagged.length;
  const total = (r: Record<string, string | number>) => ["M", "A", "N", "G"].reduce((n, k) => n + Number(r[k] ?? 0), 0);
  // Holidays and weekly offs show as zero; the low point that matters is on a working day.
  const low = [...byShift].filter((r) => total(r) > 0).sort((a, b) => total(a) - total(b))[0];
  const last = byShift.at(-1);
  return (
    <Grid>
      <ChartCard
        title={`NRL staff present each day, by shift, last ${byShift.length} days`}
        value={last ? `${total(last)} present today` : undefined}
        note={low ? `Lowest turnout was ${low.day}, with ${total(low)} present. Check that day for missing punches.` : undefined}
        series={series}
      >
        <Bars data={byShift} x="day" series={series} unit="People present" xUnit="Day" />
      </ChartCard>
      <ChartCard
        title="Your punches against your roster, last 14 days"
        value={flags ? `${flags} days need attention` : "Every day on time"}
        note={flags ? `Regularise ${flagged.map((t) => t.label).slice(0, 4).join(", ")}${flags > 4 ? " and others" : ""}.` : "Every punch matched your rostered shift."}
        series={[
          { key: "ok", label: "Punch, on time", color: C.blue },
          { key: "late", label: "Late or early", color: C.amber },
          { key: "missing", label: "Missing punch", color: C.red },
          { key: "shift", label: "Rostered shift (dashed box)", color: C.slate },
        ]}
      >
        <Timeline rows={timeline} />
      </ChartCard>
    </Grid>
  );
}

/* Roster: two weeks ahead per person, with swaps and short rest marked. */
export function RosterCharts() {
  const me = useCurrentUser();
  const employees = useHrms((s) => s.employees);
  const roster = useHrms((s) => s.roster);
  const shifts = useHrms((s) => s.shifts);
  const swaps = useHrms((s) => s.swaps);
  const settings = useHrms((s) => s.settings);
  const minRest = settingOn(settings, "min.rest", DEMO_TODAY, undefined, 11);
  const people = useMemo(
    () => employees.filter((e) => e.crew && (me?.crew ? e.crew === me.crew || e.managerId === me.id || e.id === me.id : true)).slice(0, 10),
    [employees, me],
  );
  const grid = useMemo(() => rosterGrid(people, roster, shifts, swaps, minRest), [people, roster, shifts, swaps, minRest]);
  if (!me) return null;
  let swapN = 0;
  let restN = 0;
  const flaggedCells: string[] = [];
  grid.cells.forEach((c, k) => {
    if (c.swap) swapN += 1;
    if (c.rest !== undefined) restN += 1;
    if (c.swap || c.rest !== undefined) {
      const [pid, date] = k.split("|");
      const who = people.find((p) => p.id === pid)?.preferredName ?? "";
      flaggedCells.push(`${who} ${format(parseISO(date), "d MMM")} ${c.rest !== undefined ? `${c.rest.toFixed(0)} h rest` : "swap"}`);
    }
  });
  void swapN;
  return (
    <div className="mb-6">
      <ChartCard
        title="Your crew's shifts, next 14 days"
        value={restN ? `${restN} shifts with short rest` : "Rest rule met on every shift"}
        note={
          flaggedCells.length
            ? `${flaggedCells.slice(0, 3).join("; ")}${flaggedCells.length > 3 ? `; ${flaggedCells.length - 3} more` : ""}. Red dot: under ${minRest} h rest. Amber dot: swap.`
            : `No swaps and no shift with under ${minRest} h rest.`
        }
        series={[...SHIFT_SERIES.slice(0, 3), { key: "OFF", label: "Weekly off", color: "#d8dde8" }]}
      >
        <Heatmap
          rows={people.map((p) => ({ key: p.id, label: p.preferredName }))}
          cols={grid.dates.map((d) => ({ key: d, label: d.slice(8), sub: format(parseISO(d), "EEEEE"), today: d === DEMO_TODAY }))}
          cell={(row, col) => {
            const c = grid.cells.get(`${row}|${col}`)!;
            const sh = shifts.find((s) => s.id === c.code);
            const who = people.find((p) => p.id === row)?.name ?? "";
            return {
              color: c.code === "OFF" ? "#d8dde8" : SHIFT_COLOR[c.code] ?? C.slate,
              text: c.code === "OFF" ? "" : c.code,
              mark: c.rest !== undefined ? "rest" : c.swap ? "swap" : undefined,
              title: `${who}, ${format(parseISO(col), "EEE d MMM")}`,
              detail: [
                c.code === "OFF" ? "Weekly off" : `${sh?.label} ${sh?.start}–${sh?.end}`,
                ...(c.rest !== undefined ? [`Only ${c.rest.toFixed(1)} h rest`] : []),
                ...(c.swap ? ["Shift swap requested"] : []),
              ],
            };
          }}
        />
      </ChartCard>
    </div>
  );
}

/* Gate: heads inside through the day, and why passes are blocked. */
export function GateCharts() {
  const { events, passes, punches, workers, contractors, scoped } = useCrewScope();
  const hours = useMemo(() => inPlantByHour(events, passes, punches), [events, passes, punches]);
  const blocked = useMemo(() => blockedByReason(passes, workers, contractors), [passes, workers, contractors]);
  const peak = hours.reduce((m, h) => Math.max(m, h.staff + h.contract), 0);
  return (
    <Grid>
      <ChartCard
        title={scoped ? "Your crew inside the plant by hour, today" : "People inside the plant by hour, today"}
        note={scoped ? `Peak ${peak} of your crew inside at once.` : `Peak ${peak} inside. Muster points and canteen should plan for that many.`}
        value={`Peak ${peak}`}
        series={[
          { key: "contract", label: "Contract workers", color: C.blue },
          ...(scoped ? [] : [{ key: "staff", label: "NRL staff", color: C.slate }]),
        ]}
      >
        <Areas
          data={hours}
          x="hour"
          stacked
          series={[
            { key: "contract", label: "Contract workers", color: C.blue },
            ...(scoped ? [] : [{ key: "staff", label: "NRL staff", color: C.slate }]),
          ]}
          unit="People inside"
          xUnit="Hour of day"
        />
      </ChartCard>
      <ChartCard
        title="Contract workers blocked at the gate, by reason"
        value={`${blocked.reduce((n, b) => n + b.count, 0)} passes blocked`}
        note={(() => {
          const top = [...blocked].sort((a, b) => b.count - a.count)[0];
          return top ? `Most are blocked for ${String(top.reason).toLowerCase()} (${top.count}). Clearing that brings the most workers back.` : "No passes are blocked.";
        })()}
      >
        <HBars data={blocked} y="reason" labelWidth={86} series={[{ key: "count", label: "Passes", color: C.red }]} unit="Passes blocked" />
      </ChartCard>
    </Grid>
  );
}

/* Contractors: load against licence ceiling, and what expires soon. */
export function ContractorCharts() {
  const me = useCurrentUser();
  const role = useHrms((s) => s.actingRole);
  const all = useHrms((s) => s.contractors);
  const workersAll = useHrms((s) => s.workers);
  const events = useHrms((s) => s.gateEvents);
  const passes = useHrms((s) => s.passes);
  const certs = useHrms((s) => s.certificates);
  const contractors = role === "contractor_supervisor" ? all.filter((c) => c.supervisorId === me?.id || c.id === me?.contractorId) : all;
  const ids = new Set(contractors.map((c) => c.id));
  const workers = workersAll.filter((w) => ids.has(w.contractorId));
  const load = contractorLoad(contractors, workers, events, passes);
  const windows = expiryWindows(contractors, certs, new Set(workers.map((w) => w.id)));
  const series = [
    { key: "expired", label: "Expired", color: C.red },
    { key: "d7", label: "In 7 days", color: C.amber },
    { key: "d14", label: "In 14 days", color: "#e8c98a" },
    { key: "d30", label: "In 30 days", color: C.slate },
  ];
  return (
    <Grid>
      <ChartCard
        title="Contract workers inside now, against each labour licence limit"
        note={(() => {
          const tight = load.filter((l) => Number(l.inside) >= 0.9 * (Number(l.inside) + Number(l.headroom)));
          return tight.length ? `${tight.map((l) => l.name).join(", ")} near the licence limit. Hold new passes.` : "Every contractor is inside its labour licence limit.";
        })()}
        series={[
          { key: "inside", label: "Inside now", color: C.blue },
          { key: "headroom", label: "Licence headroom", color: C.slate },
        ]}
      >
        <HBars
          data={load}
          y="name"
          series={[
            { key: "inside", label: "Inside now", color: C.blue },
            { key: "headroom", label: "Licence headroom", color: C.slate },
          ]}
          unit="Workers"
        />
      </ChartCard>
      <ChartCard
        title="Labour licences and worker certificates running out"
        note={(() => {
          const now = windows.reduce((n, w) => n + Number(w.expired) + Number(w.d7), 0);
          return now ? `${now} lapse within a week. Renew them or the gate blocks the holders.` : "Nothing lapses this week.";
        })()}
        series={series}
      >
        <HBars data={windows} y="label" labelWidth={90} series={series} unit="Licences and certificates" />
      </ChartCard>
    </Grid>
  );
}

/* Safety: certificates by course over the next 90 days. */
export function SafetyCharts() {
  const certs = useHrms((s) => s.certificates);
  const courses = useHrms((s) => s.courses);
  const rows = useMemo(() => certExpiryByCourse(certs, courses), [certs, courses]);
  const expired = rows.reduce((n, r) => n + r.expired, 0);
  const series = [
    { key: "expired", label: "Expired", color: C.red },
    { key: "d30", label: "0–30 days", color: C.amber },
    { key: "d60", label: "31–60 days", color: "#e8c98a" },
    { key: "d90", label: "61–90 days", color: C.slate },
  ];
  return (
    <div className="mb-6">
      <ChartCard
        title="Certificates expiring in the next 90 days, by course"
        value={`${expired} already expired`}
        note={(() => {
          const worst = [...rows].sort((a, b) => Number(b.expired) + Number(b.d30) - (Number(a.expired) + Number(a.d30)))[0];
          return worst ? `${worst.course} needs the next training batch first.` : "No certificates due.";
        })()}
        series={series}
        action={
          expired ? (
            <Link href="/gate" className="shrink-0 rounded-lg bg-danger-soft px-3 py-1.5 text-[12px] font-semibold text-danger transition hover:bg-danger-soft">
              See blocked passes
            </Link>
          ) : undefined
        }
      >
        <HBars data={rows} y="course" labelWidth={150} series={series} unit="Certificates" />
      </ChartCard>
    </div>
  );
}

/* Organisation and Reports: headcount by location and cadre. */
export function HeadcountCharts() {
  const employees = useHrms((s) => s.employees);
  const rows = useMemo(() => headcountByLocation(employees), [employees]);
  const series = [
    { key: "executives", label: "Executives", color: C.blue },
    { key: "workmen", label: "Workmen", color: C.sky },
    { key: "trainees", label: "Trainees", color: C.teal },
  ];
  return (
    <ChartCard
      title="Employees by location and cadre"
      note={(() => {
        const top = [...rows].sort((a, b) => Number(b.executives) + Number(b.workmen) + Number(b.trainees) - (Number(a.executives) + Number(a.workmen) + Number(a.trainees)))[0];
        return top ? `${top.location} holds most of the roll; the other sites are small offices and terminals.` : undefined;
      })()}
      series={series}
    >
      <HBars data={rows} y="location" labelWidth={96} series={series} unit="Employees" />
    </ChartCard>
  );
}

export function ReservationCharts() {
  const employees = useHrms((s) => s.employees);
  const census = liveCensus(employees);
  const cats = ["UR", "OBC", "SC", "ST", "EWS"].map((k) => ({ category: k, people: census.category[k] ?? 0 }));
  return (
    <ChartCard
      title="Employees by reservation category, with women and PwBD"
      value={`${census.onRoll.toLocaleString("en-IN")} on roll`}
      note={`Women are ${((census.women / Math.max(1, census.onRoll)) * 100).toFixed(1)}% of the roll and PwBD ${((census.pwbd / Math.max(1, census.onRoll)) * 100).toFixed(1)}%, against the 4% PwBD reservation.`}
    >
      <Bars data={[...cats, { category: "Women", people: census.women }, { category: "PwBD", people: census.pwbd }]} x="category" stacked={false} series={[{ key: "people", label: "Employees", color: C.blue }]} />
    </ChartCard>
  );
}

/* Payroll: where the current run's money goes. */
export function PayrollCharts() {
  const runs = useHrms((s) => s.payrollRuns);
  const current = runs[0];
  const run = current.results.length ? current : runs.find((r) => r.stage === "publish" && r.results.length);
  if (!run) return null;
  const parts = payrollComponents(run);
  return (
    <div className="mb-6">
      <ChartCard
        title={`${format(parseISO(`${run.month}-01`), "MMMM yyyy")} run${run.id === current.id ? "" : " (last published, current not computed)"}`}
        value={lakh(parts.at(-1)!.amount)}
        note={`Net pay across ${run.results.length.toLocaleString("en-IN")} employees.`}
      >
        <HBars data={parts} y="part" labelWidth={92} format={lakh} unit="Rupees for the month" series={[{ key: "amount", label: "Amount", color: C.blue }]} />
      </ChartCard>
    </div>
  );
}

/* Leave: days applied, approved and left, by type. */
export function LeaveCharts() {
  const me = useCurrentUser();
  const role = useHrms((s) => s.actingRole);
  const types = useHrms((s) => s.leaveTypes);
  const requests = useHrms((s) => s.leaveRequests);
  const balances = useHrms((s) => s.leaveBalances);
  const plant = role === "hr_admin" || role === "auditor";
  const rows = useMemo(() => leaveByType(types, requests, balances, plant ? undefined : me?.id), [types, requests, balances, plant, me]);
  const series = [
    { key: "applied", label: "Pending", color: C.amber },
    { key: "approved", label: "Approved", color: C.blue },
  ];
  const balance = rows.reduce((n, r) => n + r.balance, 0);
  return (
    <div className="mb-6">
      <ChartCard
        title={plant ? "Leave days pending and approved, by type, plant-wide" : "Your leave days pending and approved, by type"}
        value={`${balance.toLocaleString("en-IN")} days left`}
        note={(() => {
          const top = [...rows].sort((a, b) => Number(b.applied) + Number(b.approved) - (Number(a.applied) + Number(a.approved)))[0];
          const pending = rows.reduce((n, r) => n + Number(r.applied), 0);
          if (!top || Number(top.applied) + Number(top.approved) === 0) return "No leave taken or pending this year.";
          return `Most days are ${top.type}. ${pending ? `${pending} days still waiting for approval.` : "Nothing waiting for approval."}`;
        })()}
        series={series}
      >
        <Bars data={rows} x="type" stacked={false} series={series} height={200} unit="Days" xUnit="Leave type" />
      </ChartCard>
    </div>
  );
}

/* Recruitment: the funnel and reserved posts per opening. */
export function RecruitmentCharts() {
  const openings = useHrms((s) => s.openings);
  const candidates = useHrms((s) => s.candidates);
  const status = reservationStatus(openings, candidates);
  const open = status.reduce((n, r) => n + Number(r.open), 0);
  // The stage-by-stage pipeline lives on the board above, so this chart covers only posts.
  return (
    <div className="mb-6">
      <ChartCard
        title="Posts filled and open, per opening"
        value={`${open} posts open`}
        note={open ? "Open posts need more offers before the roster closes." : "Every post has an offer or a joiner."}
        series={[
          { key: "filled", label: "Offered or joined", color: C.blue },
          { key: "open", label: "Still open", color: C.slate },
        ]}
      >
        <HBars
          data={status}
          y="post"
          labelWidth={140}
          series={[
            { key: "filled", label: "Offered or joined", color: C.blue },
            { key: "open", label: "Still open", color: C.slate },
          ]}
          unit="Posts"
        />
      </ChartCard>
    </div>
  );
}

/* Separation: a year of leavers by reason and by unit (illustrative). */
export function SeparationCharts() {
  const reasons = [
    { key: "superannuation", label: "Superannuation", color: C.blue },
    { key: "resignation", label: "Resignation", color: C.violet },
    { key: "vrs", label: "VRS", color: C.sky },
    { key: "death", label: "Death in service", color: C.slate },
  ];
  const done = ATTRITION_UNITS_SAMPLE.reduce((n, u) => n + u.interviewed, 0);
  const total = ATTRITION_UNITS_SAMPLE.reduce((n, u) => n + u.leavers, 0);
  return (
    <Grid>
      <ChartCard
        title="Employees leaving each month, by reason, last 12 months"
        sample
        series={reasons}
        note="Superannuation leads, so plan replacements a year ahead. Illustrative: the demo data holds one separation."
      >
        <Bars data={ATTRITION_SAMPLE} x="month" series={reasons} unit="Leavers" xUnit="Month" />
      </ChartCard>
      <ChartCard
        title="Exit interviews done, by unit"
        sample
        note="Units below the line owe exit interviews before final settlement."
        value={`${Math.round((done / total) * 100)}% completed`}
        series={[
          { key: "interviewed", label: "Interviewed", color: C.blue },
          { key: "pending", label: "Not interviewed", color: C.slate },
        ]}
      >
        <HBars
          data={ATTRITION_UNITS_SAMPLE.map((u) => ({ unit: u.unit, interviewed: u.interviewed, pending: u.leavers - u.interviewed }))}
          y="unit"
          labelWidth={92}
          series={[
            { key: "interviewed", label: "Interviewed", color: C.blue },
            { key: "pending", label: "Not interviewed", color: C.slate },
          ]}
          unit="Leavers"
        />
      </ChartCard>
    </Grid>
  );
}

/* Township: occupancy and the licence fee it recovers through payroll. */
export function TownshipCharts() {
  const quarters = useHrms((s) => s.quarters);
  const rows = townshipRecovery(quarters);
  const held = rows.reduce((n, r) => n + r.held, 0);
  const vacant = rows.reduce((n, r) => n + r.vacant, 0);
  const repair = rows.reduce((n, r) => n + r.repair, 0);
  const fee = rows.reduce((n, r) => n + r.fee, 0);
  return (
    <Grid>
      <ChartCard
        title="Township quarters: held, vacant and under repair"
        value={`${vacant} vacant`}
        note={vacant ? `${vacant} vacant quarters can go to the next people on the waiting list.` : "Every quarter is held or under repair."}
      >
        <Donut
          data={[
            { key: "held", label: "Held", value: held, color: C.blue },
            { key: "vacant", label: "Vacant", value: vacant, color: C.slate },
            { key: "repair", label: "Under repair", value: repair, color: C.amber },
          ]}
          center={`${Math.round((held / Math.max(1, held + vacant + repair)) * 100)}%`}
          centerLabel="occupied"
        />
      </ChartCard>
      <ChartCard
        title="Licence fee recovered through payroll each month, by quarter type"
        value={`${inr(fee)} a month`}
        note="Deducted from residents' pay; their HRA stops while they hold a quarter."
      >
        <Bars data={rows} x="type" stacked={false} unit="Rupees a month" xUnit="Quarter type" format={(n) => inr(n)} series={[{ key: "fee", label: "Licence fee", color: C.blue }]} height={200} />
      </ChartCard>
    </Grid>
  );
}

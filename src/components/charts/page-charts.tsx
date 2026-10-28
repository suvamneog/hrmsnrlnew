"use client";

import { Areas, Bars, C, ChartCard, Donut, FunnelChart, HBars, Heatmap, Timeline } from "@/components/charts/kit";
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
import { useCurrentUser, useHrms } from "@/lib/store";
import { format, parseISO } from "date-fns";
import Link from "next/link";
import { useMemo } from "react";

const Grid = ({ children }: { children: React.ReactNode }) => <div className="mb-6 grid gap-5 *:min-w-0 xl:grid-cols-2">{children}</div>;
const lakh = (n: number) => (n >= 1e7 ? `₹${(n / 1e7).toFixed(2)} Cr` : `₹${(n / 1e5).toFixed(1)}L`);

const SHIFT_COLOR: Record<string, string> = { M: C.green, A: C.amber, N: C.violet, G: C.blue, OFF: "#eef1f6" };

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
  const series = [
    { key: "M", label: "Morning", color: C.green },
    { key: "A", label: "Afternoon", color: C.amber },
    { key: "N", label: "Night", color: C.violet },
    { key: "G", label: "General", color: C.blue },
  ];
  const flags = timeline.filter((t) => t.flag).length;
  return (
    <Grid>
      <ChartCard eyebrow="Attendance by shift" title={`Present heads, last ${byShift.length} days`} series={series} note="Staff on the biometric roster.">
        <Bars data={byShift} x="day" series={series} />
      </ChartCard>
      <ChartCard
        eyebrow="Your punches"
        title="Last 14 days against your roster"
        value={flags ? `${flags} flagged` : "All on time"}
        note="Dashed box is the rostered shift; the bar is your punch. Amber late, violet early, red missing."
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
  grid.cells.forEach((c) => {
    if (c.swap) swapN += 1;
    if (c.rest !== undefined) restN += 1;
  });
  return (
    <div className="mb-6">
      <ChartCard
        eyebrow="Coverage, next 14 days"
        title="Who works which shift"
        value={restN ? `${restN} short-rest turns` : "No rest violations"}
        note={`Amber dot: swap on that day. Red dot: less than ${minRest} h rest before the shift. ${swapN} swap day(s).`}
        series={[
          { key: "M", label: "Morning", color: C.green },
          { key: "A", label: "Afternoon", color: C.amber },
          { key: "N", label: "Night", color: C.violet },
          { key: "OFF", label: "Off", color: "#d8dde8" },
        ]}
      >
        <Heatmap
          rows={people.map((p) => ({ key: p.id, label: p.preferredName }))}
          cols={grid.dates.map((d) => ({ key: d, label: d.slice(8), sub: format(parseISO(d), "EEEEE"), today: d === DEMO_TODAY }))}
          cell={(row, col) => {
            const c = grid.cells.get(`${row}|${col}`)!;
            const sh = shifts.find((s) => s.id === c.code);
            const who = people.find((p) => p.id === row)?.name ?? "";
            return {
              color: SHIFT_COLOR[c.code] ?? C.slate,
              text: c.code === "OFF" ? "" : c.code,
              mark: c.rest !== undefined ? "rest" : c.swap ? "swap" : undefined,
              title: `${who} · ${format(parseISO(col), "EEE d MMM")}`,
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
  const events = useHrms((s) => s.gateEvents);
  const passes = useHrms((s) => s.passes);
  const punches = useHrms((s) => s.punches);
  const workers = useHrms((s) => s.workers);
  const contractors = useHrms((s) => s.contractors);
  const hours = useMemo(() => inPlantByHour(events, passes, punches), [events, passes, punches]);
  const blocked = useMemo(() => blockedByReason(passes, workers, contractors), [passes, workers, contractors]);
  const peak = hours.reduce((m, h) => Math.max(m, h.staff + h.contract), 0);
  return (
    <Grid>
      <ChartCard
        eyebrow="In plant"
        title="Heads inside by hour, today"
        value={`Peak ${peak}`}
        series={[
          { key: "contract", label: "Contract workers", color: C.blue },
          { key: "staff", label: "NRL staff", color: C.green },
        ]}
      >
        <Areas
          data={hours}
          x="hour"
          stacked
          series={[
            { key: "contract", label: "Contract workers", color: C.blue },
            { key: "staff", label: "NRL staff", color: C.green },
          ]}
        />
      </ChartCard>
      <ChartCard eyebrow="Blocked passes" title="Why workers can't enter" value={blocked.reduce((n, b) => n + b.count, 0)} note="Each pass counted once, by the first check that fails.">
        <HBars data={blocked} y="reason" labelWidth={86} series={[{ key: "count", label: "Passes", color: C.red }]} />
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
    { key: "d14", label: "In 14 days", color: "#f0c674" },
    { key: "d30", label: "In 30 days", color: C.slate },
  ];
  return (
    <Grid>
      <ChartCard
        eyebrow="Capacity"
        title="Inside now against licensed capacity"
        series={[
          { key: "inside", label: "Inside now", color: C.blue },
          { key: "headroom", label: "Licence headroom", color: "#dfe5f7" },
        ]}
      >
        <HBars
          data={load}
          y="name"
          series={[
            { key: "inside", label: "Inside now", color: C.blue },
            { key: "headroom", label: "Licence headroom", color: "#dfe5f7" },
          ]}
        />
      </ChartCard>
      <ChartCard eyebrow="Expiry" title="Licences and certificates running out" series={series}>
        <HBars data={windows} y="label" labelWidth={90} series={series} />
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
    { key: "d60", label: "31–60 days", color: "#f0c674" },
    { key: "d90", label: "61–90 days", color: C.slate },
  ];
  return (
    <div className="mb-6">
      <ChartCard
        eyebrow="Certificate expiry"
        title="Next 90 days, by course"
        value={`${expired} expired`}
        series={series}
        action={
          expired ? (
            <Link href="/gate" className="shrink-0 rounded-full bg-[#fdecec] px-3 py-1.5 text-[12px] font-semibold text-[#c43d3d] transition hover:bg-[#fbdcdc]">
              See blocked passes
            </Link>
          ) : undefined
        }
      >
        <HBars data={rows} y="course" labelWidth={150} series={series} />
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
    <ChartCard eyebrow="Headcount" title="By location and cadre" series={series}>
      <HBars data={rows} y="location" labelWidth={96} series={series} />
    </ChartCard>
  );
}

export function ReservationCharts() {
  const employees = useHrms((s) => s.employees);
  const census = liveCensus(employees);
  const cats = ["UR", "OBC", "SC", "ST", "EWS"].map((k) => ({ category: k, people: census.category[k] ?? 0 }));
  return (
    <ChartCard eyebrow="Representation" title="By category" note={`Women ${census.women} · PwBD ${census.pwbd}`}>
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
        eyebrow="Pay components"
        title={`${format(parseISO(`${run.month}-01`), "MMMM yyyy")} run${run.id === current.id ? "" : " (last published, current not computed)"}`}
        value={lakh(parts.at(-1)!.amount)}
        note={`Net pay across ${run.results.length.toLocaleString("en-IN")} employees.`}
      >
        <HBars data={parts} y="part" labelWidth={92} format={lakh} series={[{ key: "amount", label: "Amount", color: C.blue }]} />
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
    { key: "approved", label: "Approved", color: C.green },
  ];
  const balance = rows.reduce((n, r) => n + r.balance, 0);
  return (
    <div className="mb-6">
      <ChartCard
        eyebrow="Leave"
        title={plant ? "Plant, days by leave type" : "Your days by leave type"}
        value={`${balance.toLocaleString("en-IN")} days left`}
        note={rows.map((r) => `${r.type} ${r.balance}`).join(" · ")}
        series={series}
      >
        <Bars data={rows} x="type" stacked={false} series={series} height={200} />
      </ChartCard>
    </div>
  );
}

/* Recruitment: the funnel and reserved posts per opening. */
export function RecruitmentCharts() {
  const openings = useHrms((s) => s.openings);
  const candidates = useHrms((s) => s.candidates);
  const order = ["applied", "shortlist", "interview", "medical", "offer", "joined"] as const;
  const reached = (st: (typeof order)[number]) => candidates.filter((c) => order.indexOf(c.stage) >= order.indexOf(st)).length;
  const status = reservationStatus(openings, candidates);
  return (
    <Grid>
      <ChartCard eyebrow="Pipeline" title="From application to joining" note="Hover a stage to see how many carried over.">
        <FunnelChart
          steps={[
            { label: "Applied", value: reached("applied") },
            { label: "Shortlisted", value: reached("shortlist") },
            { label: "Interview", value: reached("interview") },
            { label: "Medical", value: reached("medical") },
            { label: "Offer", value: reached("offer") },
            { label: "Joined", value: reached("joined") },
          ]}
        />
      </ChartCard>
      <ChartCard
        eyebrow="Reservation"
        title="Posts filled and open, per opening"
        series={[
          { key: "filled", label: "Offered or joined", color: C.green },
          { key: "open", label: "Still open", color: "#dfe5f7" },
        ]}
      >
        <HBars
          data={status}
          y="post"
          labelWidth={140}
          series={[
            { key: "filled", label: "Offered or joined", color: C.green },
            { key: "open", label: "Still open", color: "#dfe5f7" },
          ]}
        />
      </ChartCard>
    </Grid>
  );
}

/* Separation: a year of leavers by reason and by unit (illustrative). */
export function SeparationCharts() {
  const reasons = [
    { key: "superannuation", label: "Superannuation", color: C.blue },
    { key: "resignation", label: "Resignation", color: C.amber },
    { key: "vrs", label: "VRS", color: C.violet },
    { key: "death", label: "Death in service", color: C.slate },
  ];
  const done = ATTRITION_UNITS_SAMPLE.reduce((n, u) => n + u.interviewed, 0);
  const total = ATTRITION_UNITS_SAMPLE.reduce((n, u) => n + u.leavers, 0);
  return (
    <Grid>
      <ChartCard eyebrow="Attrition" title="Leavers by reason, last 12 months" sample series={reasons} note="Illustrative: the demo data holds one separation.">
        <Bars data={ATTRITION_SAMPLE} x="month" series={reasons} />
      </ChartCard>
      <ChartCard
        eyebrow="Exit interviews"
        title="By unit"
        sample
        value={`${Math.round((done / total) * 100)}% completed`}
        series={[
          { key: "interviewed", label: "Interviewed", color: C.green },
          { key: "pending", label: "Not interviewed", color: "#dfe5f7" },
        ]}
      >
        <HBars
          data={ATTRITION_UNITS_SAMPLE.map((u) => ({ unit: u.unit, interviewed: u.interviewed, pending: u.leavers - u.interviewed }))}
          y="unit"
          labelWidth={92}
          series={[
            { key: "interviewed", label: "Interviewed", color: C.green },
            { key: "pending", label: "Not interviewed", color: "#dfe5f7" },
          ]}
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
      <ChartCard eyebrow="Occupancy" title="Held against vacant" note="Hover a slice for the count.">
        <Donut
          data={[
            { key: "held", label: "Held", value: held, color: C.blue },
            { key: "vacant", label: "Vacant", value: vacant, color: C.green },
            { key: "repair", label: "Under repair", value: repair, color: C.amber },
          ]}
          center={`${Math.round((held / Math.max(1, held + vacant + repair)) * 100)}%`}
          centerLabel="occupied"
        />
      </ChartCard>
      <ChartCard eyebrow="Recovery" title="Licence fee to payroll, per month" value={inr(fee)} note="Deducted from residents' pay; HRA stops while a quarter is held.">
        <Bars data={rows} x="type" stacked={false} format={(n) => inr(n)} series={[{ key: "fee", label: "Licence fee", color: C.blue }]} height={200} />
      </ChartCard>
    </Grid>
  );
}

"use client";

import { HeroCard as Shell } from "@/components/ui/hero-card";
import { canDecideFor } from "@/lib/access";
import { liveCensus } from "@/lib/census";
import { insideNow } from "@/lib/gate";
import { DEMO_TODAY, openPair, punchesOn } from "@/lib/demo";
import { inr, monthLabel } from "@/lib/format";
import { PAYROLL_STAGES } from "@/lib/payroll";
import { useCurrentUser, useHrms } from "@/lib/store";
import type { Employee, Role } from "@/lib/types";
import { addDays, differenceInCalendarDays, format, parseISO } from "date-fns";
import Link from "next/link";
import { Bars, Columns, Fact, Figure, Funnel, Ring, StageTrack } from "./viz";

const lakh = (n: number) => `₹${(n / 100000).toFixed(2)}L`;

/* One large card per role that leads with that role's real work. */
export function RoleHero() {
  const role = useHrms((s) => s.actingRole);
  const me = useCurrentUser();
  if (!me || !role) return null;
  if (role === "line_manager") return <CrewHero me={me} role={role} />;
  if (role === "recruiter") return <HiringHero />;
  if (role === "hr_admin") return <PeopleHero me={me} />;
  if (role === "payroll_officer" || role === "finance_approver") return <PayrollHero role={role} />;
  if (role === "contract_labour_cell" || role === "safety_officer" || role === "contractor_supervisor") {
    return <PlantHero me={me} role={role} />;
  }
  if (role === "auditor") return <AuditHero />;
  return <PayHero me={me} />;
}

function CrewHero({ me, role }: { me: Employee; role: Role }) {
  const employees = useHrms((s) => s.employees);
  const attendance = useHrms((s) => s.attendance);
  const punches = useHrms((s) => s.punches);
  const roster = useHrms((s) => s.roster);
  const leaves = useHrms((s) => s.leaveRequests);
  const swaps = useHrms((s) => s.swaps);
  const regs = useHrms((s) => s.regularisations);
  const team = employees.filter((e) => e.managerId === me.id);
  const teamIds = new Set(team.map((e) => e.id));
  const can = (id: string) => canDecideFor(role, me.id, id, teamIds);

  const today = team.map((e) => {
    const a = attendance.find((x) => x.employeeId === e.id && x.date === DEMO_TODAY);
    const shift = roster.find((r) => r.employeeId === e.id && r.date === DEMO_TODAY)?.shiftId;
    const inside = openPair(punchesOn(punches, e.id)).inside;
    return { e, a, shift, inside };
  });
  const rostered = today.filter((t) => t.shift && t.shift !== "OFF");
  const present = rostered.filter((t) => t.inside || t.a?.status === "present").length;
  const flagged = today.filter((t) => t.a?.status === "missing_punch").length;
  const otHours = attendance
    .filter((a) => teamIds.has(a.employeeId) && a.date.startsWith("2026-10"))
    .reduce((n, a) => n + a.overtime, 0);
  const week = Array.from({ length: 7 }, (_, i) => format(addDays(parseISO(DEMO_TODAY), i - 6), "yyyy-MM-dd")).map((date) => ({
    label: format(parseISO(date), "EEE"),
    value: attendance.filter((a) => teamIds.has(a.employeeId) && a.date === date && a.status === "present").length,
  }));
  const pending =
    leaves.filter((l) => l.status === "pending" && can(l.employeeId)).length +
    swaps.filter((s) => s.status === "pending" && can(s.fromId)).length +
    regs.filter((r) => r.status === "pending" && can(r.employeeId)).length;

  return (
    <Shell eyebrow="Your crew today" title={`${present} of ${rostered.length} rostered are in`} href="/roster" cta="Roster">
      <div className="grid gap-8 md:grid-cols-[auto_1fr]">
        <div className="flex items-center gap-6">
          <Ring value={present} max={Math.max(1, rostered.length)} color="#0f9f6e">
            <div>
              <p className="text-[28px] font-semibold tabular-nums tracking-tight">{present}</p>
              <p className="text-[11px] text-muted">in plant</p>
            </div>
          </Ring>
          <div className="min-w-[150px]">
            <Fact label="On weekly off" value={team.length - rostered.length} />
            <Fact label="Missed punches" value={flagged} tone={flagged ? "warn" : "ok"} />
            <Fact label="Waiting on you" value={pending} tone={pending ? "warn" : undefined} />
            <Fact label="Overtime, October" value={`${otHours.toFixed(1)} h`} />
          </div>
        </div>
        <div>
          <p className="mb-1 text-[12px] font-semibold text-muted">Crew present, last 7 days</p>
          <Columns data={week} height={96} />
        </div>
      </div>
    </Shell>
  );
}

function HiringHero() {
  const openings = useHrms((s) => s.openings);
  const candidates = useHrms((s) => s.candidates);
  const order = ["applied", "shortlist", "interview", "medical", "offer", "joined"] as const;
  // Everyone at a later stage has passed the earlier ones too.
  const reached = (stage: (typeof order)[number]) =>
    candidates.filter((c) => order.indexOf(c.stage) >= order.indexOf(stage)).length;
  const live = openings.filter((o) => o.status !== "closed");
  const posts = live.reduce((n, o) => n + o.vacancies, 0);
  const reserved = live.reduce((n, o) => n + o.split.OBC + o.split.SC + o.split.ST + o.split.EWS, 0);
  const pwbd = live.reduce((n, o) => n + o.split.PwBD, 0);

  return (
    <Shell eyebrow="Hiring" title={`${posts} posts open across ${live.length} openings`} href="/recruitment" cta="Pipeline">
      <div className="grid gap-8 md:grid-cols-[1fr_220px]">
        <Funnel
          steps={[
            { label: "Applied", value: reached("applied") },
            { label: "Shortlist", value: reached("shortlist") },
            { label: "Interview", value: reached("interview") },
            { label: "Medical", value: reached("medical") },
            { label: "Offer", value: reached("offer") },
          ]}
        />
        <div>
          <Figure value={reserved} label="Reserved posts (OBC, SC, ST, EWS)" />
          <div className="mt-5">
            <Fact label="Unreserved" value={posts - reserved} />
            <Fact label="PwBD, horizontal" value={pwbd} />
            <Fact label="Offers out" value={candidates.filter((c) => c.stage === "offer").length} tone="ok" />
          </div>
        </div>
      </div>
    </Shell>
  );
}

function PeopleHero({ me }: { me: Employee }) {
  const employees = useHrms((s) => s.employees);
  const changes = useHrms((s) => s.changes);
  const separations = useHrms((s) => s.separations);
  const positions = useHrms((s) => s.positions);
  const census = liveCensus(employees);
  const checker = changes.filter((c) => c.status === "pending" && c.field !== "bank" && c.field !== "promotion" && c.employeeId !== me.id).length;
  const notice = separations.filter((s) => s.status !== "settled").length;
  const probation = employees.filter((e) => e.status === "probation").length;

  return (
    <Shell eyebrow="Workforce" title={`${census.onRoll.toLocaleString("en-IN")} on roll`} href="/people" cta="People">
      <div className="grid gap-8 md:grid-cols-[1fr_220px]">
        <div>
          <p className="mb-3 text-[12px] font-semibold text-muted">By cadre</p>
          <Bars
            rows={[
              { label: "Workmen", value: census.workmen, tone: "var(--brand)" },
              { label: "Executives", value: census.executives, tone: "#8fa0ff" },
              { label: "Trainees", value: census.trainees, tone: "#c3cdff" },
            ]}
          />
          <p className="mt-5 text-[12px] text-muted">
            Women {census.women} · PwBD {census.pwbd} · {((census.women / Math.max(1, census.onRoll)) * 100).toFixed(1)}% women
          </p>
          <p className="mt-1 text-[12px] text-muted">Demo sample. NRL publishes 1,120 on roll.</p>
        </div>
        <div>
          <Fact label="Changes to check" value={checker} tone={checker ? "warn" : "ok"} />
          <Fact label="Separations open" value={notice} />
          <Fact label="On probation" value={probation} />
          <Fact label="Positions vacant" value={positions.filter((p) => p.vacant).length} />
        </div>
      </div>
    </Shell>
  );
}

function PayrollHero({ role }: { role: Role }) {
  const runs = useHrms((s) => s.payrollRuns);
  const employees = useHrms((s) => s.employees);
  const run = runs[0];
  const blockers = run.results.filter((r) => r.flags.some((f) => f.severity === "block")).length;
  const warns = run.results.filter((r) => r.flags.some((f) => f.severity === "warn")).length;
  const paid = runs.find((r) => r.stage === "publish" && r.id !== run.id);
  const cadreOf = new Map(employees.map((e) => [e.id, e.cadre]));
  const byCadre = (["executive", "workman", "trainee"] as const).map((c) => {
    const rows = (paid?.results ?? []).filter((r) => cadreOf.get(r.employeeId) === c);
    return {
      label: c === "executive" ? "Executives" : c === "workman" ? "Workmen" : "Trainees",
      value: rows.length ? Math.round(rows.reduce((n, r) => n + r.net, 0) / rows.length) : 0,
    };
  });
  const waitingOnFinance = run.stage === "finance_approval";
  const title =
    run.stage === "publish"
      ? `${monthLabel(run.month)} is published`
      : waitingOnFinance
        ? role === "finance_approver"
          ? `${monthLabel(run.month)} is waiting for your release`
          : `${monthLabel(run.month)} is with finance`
        : `${monthLabel(run.month)} is in ${PAYROLL_STAGES.find((s) => s.id === run.stage)?.label.toLowerCase()}`;

  return (
    <Shell eyebrow="Payroll run" title={title} href="/payroll" cta="Open run">
      <StageTrack stages={PAYROLL_STAGES} current={run.stage} />
      <div className="mt-7 grid gap-8 md:grid-cols-[1fr_240px]">
        <div>
          <p className="mb-3 text-[12px] font-semibold text-muted">
            Average net pay by cadre{paid ? `, ${monthLabel(paid.month)}` : ""}
          </p>
          <Bars rows={byCadre} format={(n) => inr(n)} />
        </div>
        <div>
          {run.totals ? (
            <Figure value={run.totals.net} label={`Net pay, ${run.totals.employees.toLocaleString("en-IN")} people`} format={(n) => `₹${(n / 1e7).toFixed(2)} Cr`} />
          ) : (
            <div>
              <p className="text-[22px] font-semibold tracking-tight">Not computed</p>
              <p className="mt-2 text-[12px] font-medium text-muted">
                {run.lockedAttendance ? "Compute to see net pay" : "Lock attendance to start"}
              </p>
            </div>
          )}
          <div className="mt-5">
            <Fact label="Blocking checks" value={blockers} tone={blockers ? "danger" : "ok"} />
            <Fact label="Warnings" value={warns} tone={warns ? "warn" : undefined} />
            <Fact label="Attendance" value={run.lockedAttendance ? "Locked" : "Open"} />
          </div>
        </div>
      </div>
    </Shell>
  );
}

function PlantHero({ me, role }: { me: Employee; role: Role }) {
  const contractorsAll = useHrms((s) => s.contractors);
  const workersAll = useHrms((s) => s.workers);
  const passes = useHrms((s) => s.passes);
  const events = useHrms((s) => s.gateEvents);
  const certs = useHrms((s) => s.certificates);
  const contractors =
    role === "contractor_supervisor"
      ? contractorsAll.filter((c) => c.supervisorId === me.id || c.id === me.contractorId)
      : contractorsAll;
  const ids = new Set(contractors.map((c) => c.id));
  const workers = workersAll.filter((w) => ids.has(w.contractorId));
  const workerIds = new Set(workers.map((w) => w.id));

  const insideIds = insideNow(events, passes, workerIds);
  const byFirm = contractors.map((c) => ({
    label: c.name.replace(/ (Ltd|Limited|\(India\)).*$/, ""),
    value: workers.filter((w) => w.contractorId === c.id && insideIds.has(w.id)).length,
    hint: `/ ${workers.filter((w) => w.contractorId === c.id).length}`,
  }));
  const mine = certs.filter(
    (c) => workerIds.has(c.personId) || (c.personKind === "employee" && role !== "contractor_supervisor"),
  );
  const days = (iso: string) => differenceInCalendarDays(parseISO(iso), parseISO(DEMO_TODAY));
  const expired = mine.filter((c) => days(c.expires) < 0).length;
  const dueSoon = mine.filter((c) => days(c.expires) >= 0 && days(c.expires) <= 45).length;
  const blocked = passes.filter((p) => workerIds.has(p.workerId) && p.blocked).length;
  const licences = contractors.filter((c) => days(c.licenceExpiry) <= 45).length;

  return (
    <Shell
      eyebrow={role === "safety_officer" ? "Plant safety" : "Contract workforce"}
      title={`${insideIds.size} workers inside the plant`}
      href={role === "safety_officer" ? "/safety" : "/contractors"}
      cta={role === "safety_officer" ? "Certificates" : "Register"}
    >
      <div className="grid gap-8 md:grid-cols-[1fr_auto]">
        <div>
          <p className="mb-3 text-[12px] font-semibold text-muted">Inside now, by contractor</p>
          <Bars rows={byFirm} />
        </div>
        <div className="flex items-center gap-6">
          <Ring value={mine.length - expired - dueSoon} max={Math.max(1, mine.length)} color="#0f9f6e" size={120}>
            <div>
              <p className="text-[22px] font-semibold tabular-nums tracking-tight">
                {Math.round(((mine.length - expired - dueSoon) / Math.max(1, mine.length)) * 100)}%
              </p>
              <p className="text-[11px] text-muted">certs valid</p>
            </div>
          </Ring>
          <div className="min-w-[150px]">
            <Fact label="Expired" value={expired} tone={expired ? "danger" : "ok"} />
            <Fact label="Due in 45 days" value={dueSoon} tone={dueSoon ? "warn" : undefined} />
            <Fact label="Passes blocked" value={blocked} tone={blocked ? "warn" : "ok"} />
            <Fact label="Licences due" value={licences} tone={licences ? "warn" : "ok"} />
          </div>
        </div>
      </div>
    </Shell>
  );
}

function AuditHero() {
  const audit = useHrms((s) => s.audit);
  const breaches = useHrms((s) => s.breaches);
  const labels: Record<string, string> = {
    auth: "Sign-ins",
    payroll: "Payroll",
    policy: "Rules engine",
    hr: "Records",
    leave: "Leave",
    gate: "Gate",
    sep: "Separation",
    clm: "Contract labour",
    privacy: "Privacy",
    gov: "Reports",
  };
  const bySource = Object.entries(
    audit.reduce<Record<string, number>>((m, a) => ((m[a.source] = (m[a.source] ?? 0) + 1), m), {}),
  )
    .map(([k, v]) => ({ label: labels[k] ?? k, value: v }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);
  const reveals = audit.filter((a) => a.action === "reveal_pii").length;
  const policy = audit.filter((a) => a.source === "policy").length;

  return (
    <Shell eyebrow="Audit trail" title={`${audit.length} events on record`} href="/audit" cta="Trail">
      <div className="grid gap-8 md:grid-cols-[1fr_220px]">
        <div>
          <p className="mb-3 text-[12px] font-semibold text-muted">Events by area</p>
          <Bars rows={bySource} />
        </div>
        <div>
          <Fact label="Identifier reveals" value={reveals} tone={reveals ? "warn" : undefined} />
          <Fact label="Rule changes" value={policy} />
          <Fact label="Breaches logged" value={breaches.length} tone={breaches.length ? "danger" : "ok"} />
        </div>
      </div>
    </Shell>
  );
}

function PayHero({ me }: { me: Employee }) {
  const runs = useHrms((s) => s.payrollRuns);
  const roster = useHrms((s) => s.roster);
  const shifts = useHrms((s) => s.shifts);
  const balances = useHrms((s) => s.leaveBalances);
  const slip = runs.filter((r) => r.stage === "publish").map((r) => ({ run: r, row: r.results.find((x) => x.employeeId === me.id) })).find((x) => x.row);
  const tomorrow = format(addDays(parseISO(DEMO_TODAY), 1), "yyyy-MM-dd");
  const next = roster.find((r) => r.employeeId === me.id && r.date === tomorrow);
  const nextShift = next?.shiftId === "OFF" ? "Weekly off" : shifts.find((s) => s.id === next?.shiftId)?.label ?? "General";
  const el = balances.find((b) => b.employeeId === me.id && b.typeId === "el")?.balance ?? 0;

  if (!slip?.row) {
    return (
      <Shell eyebrow="Your pay" title="No payslip published yet" href="/payslips" cta="Payslips">
        <Fact label="Tomorrow" value={nextShift} />
        <Fact label="Earned leave" value={`${el} days`} />
      </Shell>
    );
  }
  const { run, row } = slip;
  const deductions = row.lines.filter((l) => l.type === "deduction");
  const top = [...deductions].sort((a, b) => b.amount - a.amount).slice(0, 4);

  return (
    <Shell eyebrow="Your pay" title={`${monthLabel(run.month)} payslip`} href={`/payroll/${me.id}?month=${run.month}`} cta="Open slip">
      <div className="grid gap-8 md:grid-cols-[auto_1fr]">
        <div className="flex items-center gap-6">
          <Ring value={row.net} max={row.gross}>
            <div>
              <p className="text-[22px] font-semibold tabular-nums tracking-tight">{Math.round((row.net / row.gross) * 100)}%</p>
              <p className="text-[11px] text-muted">take-home</p>
            </div>
          </Ring>
          <div>
            <Figure value={row.net} label="Net pay" format={(n) => inr(Math.round(n))} />
            <p className="mt-3 text-[12px] text-muted">Gross {lakh(row.gross)}</p>
          </div>
        </div>
        <div>
          <p className="mb-3 text-[12px] font-semibold text-muted">Where deductions go</p>
          <Bars rows={top.map((l) => ({ label: l.label, value: Math.round(l.amount) }))} color="#8fa0ff" format={(n) => inr(n)} />
          <div className="mt-4 grid grid-cols-2 gap-x-6">
            <Fact label="Tomorrow" value={nextShift} />
            <Fact label="Earned leave" value={`${el} days`} />
          </div>
        </div>
      </div>
    </Shell>
  );
}

"use client";

import { format, parseISO } from "date-fns";
import { AttendanceStrip } from "@/components/ess/attendance-strip";
import { RoleHero } from "@/components/home/role-hero";
import { DashboardCharts } from "@/components/home/dashboard-charts";
import { TodayList, useToday } from "@/components/home/today";
import { insideNow } from "@/lib/gate";
import { QuickActions } from "@/components/ess/quick-actions";
import { HomeRightRail } from "@/components/home/right-rail";
import { KpiStrip, buildHomeKpis } from "@/components/home/kpi-strip";
import { WorkBoard } from "@/components/home/work-board";
import { AnimatedGroup } from "@/components/motion/animated-group";
import { InView } from "@/components/motion/in-view";
import { ScrollReveal } from "@/components/motion/scroll-reveal";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { canDecideFor, claimApproverRole, routeAllowed } from "@/lib/access";
import { formatDay, inr } from "@/lib/format";
import { positionTitle, unitName } from "@/lib/org";
import { cadreTone, requestTone } from "@/lib/status";
import { useCurrentUser, useHrms } from "@/lib/store";
import Link from "next/link";

export default function HomePage() {
  const me = useCurrentUser();
  const employees = useHrms((s) => s.employees);
  const leaves = useHrms((s) => s.leaveRequests);
  const balances = useHrms((s) => s.leaveBalances);
  const types = useHrms((s) => s.leaveTypes);
  const run = useHrms((s) => s.payrollRuns[0]);
  const latestSlip = useHrms((s) => s.payrollRuns.find((r) => r.stage === "publish"));
  const workers = useHrms((s) => s.workers);
  const contractors = useHrms((s) => s.contractors);
  const events = useHrms((s) => s.gateEvents);
  const passes = useHrms((s) => s.passes);
  const claims = useHrms((s) => s.claims);
  const swaps = useHrms((s) => s.swaps);
  const regs = useHrms((s) => s.regularisations);
  const openings = useHrms((s) => s.openings);
  const candidates = useHrms((s) => s.candidates);
  const role = useHrms((s) => s.actingRole);
  const today = useToday();
  if (!me) return null;

  const hour = new Date().getHours();
  const hello = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const myBal = balances.filter((b) => b.employeeId === me.id);
  const team = employees.filter((e) => e.managerId === me.id);
  const teamIds = new Set(team.map((e) => e.id));
  const canDecide = (empId: string) => canDecideFor(role, me.id, empId, teamIds);

  const pendingLeave = leaves.filter((l) => l.status === "pending" && canDecide(l.employeeId));
  const claimInbox = claims.filter((c) => {
    if (c.status !== "pending" || c.employeeId === me.id) return false;
    if (role === "finance_approver") return c.amount >= 25000;
    if (!role || !claimApproverRole(c.amount).includes(role)) return false;
    return canDecide(c.employeeId);
  });
  const pendingSwaps = swaps.filter((s) => s.status === "pending" && canDecide(s.fromId));
  const pendingRegs = regs.filter((r) => r.status === "pending" && canDecide(r.employeeId));
  const myOpen = [
    ...leaves.filter((l) => l.employeeId === me.id && l.status === "pending"),
    ...claims.filter((c) => c.employeeId === me.id && c.status === "pending"),
  ];
  const todoCount = pendingLeave.length + claimInbox.length + pendingSwaps.length + pendingRegs.length;

  // A contractor's supervisor sees only their own firm's crew, never plant-wide figures.
  const supervisor = role === "contractor_supervisor";
  const myContractors = supervisor
    ? contractors.filter((c) => c.supervisorId === me.id || c.id === me.contractorId)
    : contractors;
  const myContractorIds = new Set(myContractors.map((c) => c.id));
  const myWorkers = supervisor ? workers.filter((w) => myContractorIds.has(w.contractorId)) : workers;
  const myWorkerIds = new Set(myWorkers.map((w) => w.id));
  const myPasses = supervisor ? passes.filter((p) => myWorkerIds.has(p.workerId)) : passes;

  const inside = insideNow(events, passes, myWorkerIds);

  const ess = routeAllowed("/leave", role);
  const canApprove = role === "line_manager" || role === "hr_admin" || role === "finance_approver";
  const elBalance = myBal.find((b) => b.typeId === "el")?.balance ?? 0;

  const kpis = buildHomeKpis({
    role,
    todoCount,
    inside: inside.size,
    workers: myWorkers.length,
    blocked: myPasses.filter((p) => p.blocked).length,
    contractors: myContractors.length,
    teamSize: team.length,
    elBalance,
    myOpen: myOpen.length,
    payrollStage: run?.stage,
    latestSlip: latestSlip ? format(parseISO(`${latestSlip.month}-01`), "MMM yyyy") : undefined,
    openings: openings.length,
    interviews: candidates.filter((c) => c.stage === "interview" || c.stage === "medical").length,
  });

  const nearby = supervisor ? [] : (team.length ? team : employees.filter((e) => e.locationId === me.locationId && e.id !== me.id)).slice(0, 6);

  return (
    <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_280px]">
      <div className="space-y-5">
        <InView delay={0} className="flex flex-wrap items-end justify-between gap-3" viewOptions={{ amount: 0.01, margin: "0px" }}>
          <div>
            <h1 className="text-[28px] font-semibold tracking-tight sm:text-[32px]">
              {hello}, {me.preferredName}
            </h1>
            <p className="mt-1 text-sm text-muted">
              {positionTitle(me.positionId)} · {unitName(me.unitId)}
            </p>
          </div>
          {canApprove && todoCount > 0 && (
            <Link href="/approvals" className="text-sm font-semibold text-brand">
              {todoCount} in inbox
            </Link>
          )}
        </InView>

        <TodayList items={today} />

        <KpiStrip items={kpis} />

        <DashboardCharts />

        <AnimatedGroup preset="slide" className="grid gap-4">
          <RoleHero />
          {me.cadre !== "contract" && <AttendanceStrip />}
          {ess && (
            <div className="grid gap-4 xl:grid-cols-2">
              <Card className="p-4">
                <QuickActions />
              </Card>
              <Card className="p-5">
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="font-semibold">Leave</h2>
                  <Link href="/leave" className="text-sm font-semibold text-brand">
                    Apply
                  </Link>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {myBal.map((b) => {
                    const t = types.find((x) => x.id === b.typeId);
                    return (
                      <Link key={b.typeId} href="/leave" className="rounded-2xl bg-[#f6f8fd] px-2 py-3 text-center">
                        <p className="text-[11px] font-semibold text-muted">{t?.code}</p>
                        <p className="mt-1 text-2xl font-semibold tabular-nums">{b.balance}</p>
                      </Link>
                    );
                  })}
                </div>
              </Card>
            </div>
          )}
        </AnimatedGroup>

        <WorkBoard />

        {ess && myOpen.length > 0 && (
          <ScrollReveal>
            <Card className="p-5">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="font-semibold">My requests</h2>
                <Link href="/approvals" className="text-sm font-semibold text-brand">
                  Inbox
                </Link>
              </div>
              <ul className="space-y-2">
                {leaves
                  .filter((l) => l.employeeId === me.id && l.status === "pending")
                  .map((l) => (
                    <li key={l.id} className="flex items-center justify-between rounded-2xl bg-[#f6f8fd] px-3 py-2.5 text-sm">
                      <span>
                        {types.find((t) => t.id === l.typeId)?.name} · {formatDay(l.from)}
                      </span>
                      <Badge tone={requestTone(l.status)}>{l.status}</Badge>
                    </li>
                  ))}
                {claims
                  .filter((c) => c.employeeId === me.id && c.status === "pending")
                  .map((c) => (
                    <li key={c.id} className="flex items-center justify-between rounded-2xl bg-[#f6f8fd] px-3 py-2.5 text-sm">
                      <span>
                        {c.type} · {inr(c.amount)}
                      </span>
                      <Badge tone="warn">claim</Badge>
                    </li>
                  ))}
              </ul>
            </Card>
          </ScrollReveal>
        )}

        {!supervisor && (team.length > 0 || routeAllowed("/people", role) || nearby.length > 0) && (
          <ScrollReveal>
            <Card className="p-5">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="font-semibold">{team.length ? "Your crew" : "People around you"}</h2>
                {routeAllowed("/people", role) && (
                  <Link href="/people" className="text-sm font-semibold text-brand">
                    Directory
                  </Link>
                )}
              </div>
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
                {nearby.map((e) => (
                  <Link
                    key={e.id}
                    href={routeAllowed("/people", role) ? `/people/${e.id}` : "/home"}
                    className="rounded-2xl bg-[#f6f8fd] p-3 transition hover:bg-brand-soft"
                  >
                    <Avatar name={e.name} size={40} />
                    <p className="mt-2 truncate text-sm font-semibold">{e.preferredName}</p>
                    <Badge tone={cadreTone(e.cadre)}>{e.grade}</Badge>
                  </Link>
                ))}
              </div>
            </Card>
          </ScrollReveal>
        )}
      </div>
      <HomeRightRail />
    </div>
  );
}

"use client";

import { format, parseISO } from "date-fns";
import { DashboardCharts, type HomeChart } from "@/components/home/dashboard-charts";
import { TodayList, useToday } from "@/components/home/today";
import { insideNow } from "@/lib/gate";
import { KpiStrip, buildHomeKpis } from "@/components/home/kpi-strip";
import { canDecideFor, claimApproverRole } from "@/lib/access";
import { locationName, positionTitle, unitName } from "@/lib/org";
import { DEMO_TODAY } from "@/lib/demo";
import { useCurrentUser, useHrms } from "@/lib/store";
import Link from "next/link";

export default function HomePage() {
  const me = useCurrentUser();
  const employees = useHrms((s) => s.employees);
  const leaves = useHrms((s) => s.leaveRequests);
  const balances = useHrms((s) => s.leaveBalances);
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


  // One structure for every role: what to do today, four numbers, and the one chart that matters.
  const chart: HomeChart | null =
    role === "hr_admin" || role === "auditor" || role === "payroll_officer" || role === "finance_approver"
      ? "attendance"
      : role === "line_manager"
        ? "crews"
        : role === "contract_labour_cell" || role === "safety_officer" || role === "contractor_supervisor"
          ? "gate"
          : null;

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[28px] font-semibold tracking-tight">Home</h1>
          <p className="mt-1 text-sm text-muted">
            {`${me.preferredName}, ${positionTitle(me.positionId)}, ${unitName(me.unitId)}, ${locationName(me.locationId)}. ${format(parseISO(DEMO_TODAY), "EEEE d MMMM")}.`}
          </p>
        </div>
        {canApprove && todoCount > 0 && (
          <Link href="/approvals" className="text-sm font-medium text-brand">
            {`${todoCount} in inbox`}
          </Link>
        )}
      </div>

      <TodayList items={today} />

      <KpiStrip items={kpis.slice(0, 4)} />

      {chart && <DashboardCharts only={chart} />}
    </div>
  );
}

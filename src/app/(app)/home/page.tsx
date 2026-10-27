"use client";

import { PunchCard } from "@/components/ess/punch-card";
import { QuickActions } from "@/components/ess/quick-actions";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { canDecideFor } from "@/lib/access";
import { liveCensus } from "@/lib/census";
import { DEMO_TODAY } from "@/lib/demo";
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
  const workers = useHrms((s) => s.workers);
  const events = useHrms((s) => s.gateEvents);
  const passes = useHrms((s) => s.passes);
  const holidays = useHrms((s) => s.holidays);
  const claims = useHrms((s) => s.claims);
  const swaps = useHrms((s) => s.swaps);
  const regs = useHrms((s) => s.regularisations);
  const role = useHrms((s) => s.actingRole);
  if (!me) return null;

  const hour = new Date().getHours();
  const hello = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const myBal = balances.filter((b) => b.employeeId === me.id);
  const team = employees.filter((e) => e.managerId === me.id);
  const teamIds = new Set(team.map((e) => e.id));
  const canDecide = (empId: string) => canDecideFor(role, me.id, empId, teamIds);

  const pendingLeave = leaves.filter((l) => l.status === "pending" && canDecide(l.employeeId));
  const claimInbox = claims.filter(
    (c) => c.status === "pending" && canDecide(c.employeeId) && (role === "hr_admin" || role === "line_manager" || role === "finance_approver"),
  );
  const pendingSwaps = swaps.filter((s) => s.status === "pending" && canDecide(s.fromId));
  const pendingRegs = regs.filter((r) => r.status === "pending" && canDecide(r.employeeId));
  const myOpen = [
    ...leaves.filter((l) => l.employeeId === me.id && l.status === "pending"),
    ...claims.filter((c) => c.employeeId === me.id && c.status === "pending"),
  ];
  const todoCount = pendingLeave.length + claimInbox.length + pendingSwaps.length + pendingRegs.length;

  const inside = new Set(
    workers
      .map((w) => w.id)
      .filter((id) => {
        const ev = events.filter((g) => passes.find((p) => p.id === g.passId)?.workerId === id);
        return ev[0]?.direction === "in";
      }),
  );

  const showOps =
    role === "hr_admin" ||
    role === "payroll_officer" ||
    role === "finance_approver" ||
    role === "auditor" ||
    role === "line_manager" ||
    role === "contract_labour_cell";

  const census = liveCensus(employees);
  const kpis = [
    { label: "On roll", value: census.onRoll.toLocaleString("en-IN"), hint: `${census.executives} exec · ${census.workmen} workmen`, bg: "bg-[#e7f8ef]", c: "text-[#0f9f6e]", href: "/people", text: true },
    { label: "Waiting on you", value: todoCount, hint: "Leave, claims, swaps", bg: "bg-[#fff1e6]", c: "text-[#e07a3d]", href: "/approvals" },
    { label: "Contract in plant", value: inside.size, hint: "Live gate count", bg: "bg-[#eeeaff]", c: "text-[#5b5bd6]", href: role === "hr_admin" || role === "contract_labour_cell" || role === "safety_officer" || role === "auditor" ? "/contractors" : "/home" },
    { label: "Payroll", value: run.stage.replace("_", " "), hint: "October 2026", bg: "bg-[#fdeef4]", c: "text-[#d4537e]", href: "/payroll", text: true },
  ];

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[28px] font-semibold tracking-tight sm:text-[32px]">
            {hello}, {me.preferredName}
          </h1>
          <p className="mt-1 text-sm text-muted">
            {positionTitle(me.positionId)} · {unitName(me.unitId)}
          </p>
        </div>
        {todoCount > 0 && (
          <Link href="/approvals" className="text-sm font-semibold text-brand">
            {todoCount} in inbox
          </Link>
        )}
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.15fr_1fr]">
        <PunchCard />
        <div className="space-y-4">
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
      </div>

      {showOps && (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {kpis.map((k) => (
            <Link key={k.label} href={k.href}>
              <div className={`rounded-[22px] p-4 ${k.bg}`}>
                <p className="text-xs font-medium text-muted">{k.label}</p>
                <p className={`mt-2 text-2xl font-semibold tracking-tight ${k.c}`}>
                  {"text" in k && k.text ? (
                    <span className="text-lg capitalize">{String(k.value)}</span>
                  ) : (
                    k.value
                  )}
                </p>
                <p className="mt-1 text-xs text-muted">{k.hint}</p>
              </div>
            </Link>
          ))}
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-semibold">My requests</h2>
            <Link href="/approvals" className="text-sm font-semibold text-brand">
              Inbox
            </Link>
          </div>
          {myOpen.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted">Nothing pending from you.</p>
          ) : (
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
          )}
        </Card>
        <Card className="p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-semibold">Waiting on you</h2>
            <Link href="/approvals" className="text-sm font-semibold text-brand">
              Open
            </Link>
          </div>
          {todoCount === 0 ? (
            <p className="py-6 text-center text-sm text-muted">Queue is clear.</p>
          ) : (
            <div className="space-y-2">
              {pendingLeave.slice(0, 4).map((l) => {
                const who = employees.find((e) => e.id === l.employeeId);
                return (
                  <Link key={l.id} href="/approvals" className="flex items-center gap-3 rounded-2xl bg-[#f6f8fd] px-3 py-2.5">
                    <Avatar name={who?.name ?? ""} size={36} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">{who?.name}</p>
                      <p className="text-xs text-muted">
                        {types.find((t) => t.id === l.typeId)?.name} · {l.days}d
                      </p>
                    </div>
                    <Badge tone="warn">leave</Badge>
                  </Link>
                );
              })}
              {claimInbox.slice(0, 2).map((c) => {
                const who = employees.find((e) => e.id === c.employeeId);
                return (
                  <Link key={c.id} href="/approvals" className="flex items-center gap-3 rounded-2xl bg-[#f6f8fd] px-3 py-2.5">
                    <Avatar name={who?.name ?? ""} size={36} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">{who?.name}</p>
                      <p className="text-xs text-muted">
                        {c.type} · {inr(c.amount)}
                      </p>
                    </div>
                    <Badge tone="peach">claim</Badge>
                  </Link>
                );
              })}
              {pendingSwaps.map((s) => (
                <Link key={s.id} href="/approvals" className="flex items-center gap-3 rounded-2xl bg-[#f6f8fd] px-3 py-2.5">
                  <Avatar name={employees.find((e) => e.id === s.fromId)?.name ?? ""} size={36} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{employees.find((e) => e.id === s.fromId)?.name}</p>
                    <p className="text-xs text-muted">Swap · {formatDay(s.date)}</p>
                  </div>
                  <Badge tone="muted">swap</Badge>
                </Link>
              ))}
              {pendingRegs.map((r) => (
                <Link key={r.id} href="/approvals" className="flex items-center gap-3 rounded-2xl bg-[#f6f8fd] px-3 py-2.5">
                  <Avatar name={employees.find((e) => e.id === r.employeeId)?.name ?? ""} size={36} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{employees.find((e) => e.id === r.employeeId)?.name}</p>
                    <p className="text-xs text-muted">Regularise · {formatDay(r.date)}</p>
                  </div>
                  <Badge tone="muted">punch</Badge>
                </Link>
              ))}
            </div>
          )}
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <h2 className="mb-3 font-semibold">Upcoming holidays</h2>
          <ul className="space-y-2.5">
            {holidays
              .filter((h) => h.date >= DEMO_TODAY)
              .slice(0, 4)
              .map((h) => (
                <li key={h.date} className="flex items-center justify-between text-sm">
                  <span>{h.name}</span>
                  <span className="tabular-nums text-muted">{formatDay(h.date)}</span>
                </li>
              ))}
          </ul>
        </Card>
        <Card className="p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-semibold">{team.length ? "Your crew" : "People around you"}</h2>
            <Link href="/people" className="text-sm font-semibold text-brand">
              Directory
            </Link>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {(team.length ? team : employees.filter((e) => e.locationId === me.locationId && e.id !== me.id))
              .slice(0, 6)
              .map((e) => (
                <Link key={e.id} href={`/people/${e.id}`} className="rounded-2xl bg-[#f6f8fd] p-3 transition hover:bg-brand-soft">
                  <Avatar name={e.name} size={40} />
                  <p className="mt-2 truncate text-sm font-semibold">{e.preferredName}</p>
                  <Badge tone={cadreTone(e.cadre)}>{e.grade}</Badge>
                </Link>
              ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

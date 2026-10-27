"use client";

import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { HoldToConfirm } from "@/components/ui/hold-to-confirm";
import { ScrollFade } from "@/components/ui/scroll-fade";
import { canDecideFor, claimApproverRole } from "@/lib/access";
import { formatDay, inr } from "@/lib/format";
import { useCurrentUser, useHrms } from "@/lib/store";
import { useMemo, useState } from "react";
import { toast } from "sonner";

type Kind = "all" | "leave" | "time" | "claim";
type Scope = "todo" | "mine";

type Row = {
  id: string;
  kind: Exclude<Kind, "all">;
  title: string;
  sub: string;
  who: string;
  own: boolean;
  approve?: () => void;
  reject?: () => void;
  hold?: boolean;
};

export default function ApprovalsPage() {
  const me = useCurrentUser();
  const employees = useHrms((s) => s.employees);
  const types = useHrms((s) => s.leaveTypes);
  const leaves = useHrms((s) => s.leaveRequests);
  const swaps = useHrms((s) => s.swaps);
  const regs = useHrms((s) => s.regularisations);
  const claims = useHrms((s) => s.claims);
  const decideLeave = useHrms((s) => s.decideLeave);
  const decideSwap = useHrms((s) => s.decideSwap);
  const decideReg = useHrms((s) => s.decideRegularisation);
  const decideClaim = useHrms((s) => s.decideClaim);
  const withdraw = useHrms((s) => s.withdrawLeave);
  const changes = useHrms((s) => s.changes);
  const decideChange = useHrms((s) => s.decideChange);
  const role = useHrms((s) => s.actingRole);
  const [picked, setPicked] = useState<Scope | null>(null);
  const [kind, setKind] = useState<Kind>("all");
  if (!me) return null;

  const teamIds = useMemo(
    () => new Set(employees.filter((e) => e.managerId === me.id).map((e) => e.id)),
    [employees, me.id],
  );
  const can = (empId: string) => canDecideFor(role, me.id, empId, teamIds);

  const nameOf = (id: string) => employees.find((e) => e.id === id)?.name ?? id;

  const rows: Row[] = [];
  for (const l of leaves.filter((x) => x.status === "pending")) {
    const own = l.employeeId === me.id;
    if (!own && !can(l.employeeId)) continue;
    rows.push({
      id: l.id,
      kind: "leave",
      title: `${types.find((t) => t.id === l.typeId)?.name ?? "Leave"} · ${l.days}d`,
      sub: `${formatDay(l.from)}${l.from !== l.to ? ` – ${formatDay(l.to)}` : ""} · ${l.reason}`,
      who: nameOf(l.employeeId),
      own,
      approve: own ? undefined : () => { decideLeave(l.id, "approved"); toast.success("Approved"); },
      reject: own
        ? () => { withdraw(l.id); toast("Withdrawn"); }
        : () => { decideLeave(l.id, "rejected"); toast("Rejected"); },
    });
  }
  for (const s of swaps.filter((x) => x.status === "pending")) {
    const own = s.fromId === me.id || s.toId === me.id;
    if (!own && !can(s.fromId)) continue;
    rows.push({
      id: s.id,
      kind: "time",
      title: `Shift swap · ${formatDay(s.date)}`,
      sub: `${nameOf(s.fromId)} with ${nameOf(s.toId)}`,
      who: nameOf(s.fromId),
      own,
      approve: own ? undefined : () => { decideSwap(s.id, "approved"); toast.success("Approved"); },
      reject: own ? undefined : () => { decideSwap(s.id, "rejected"); toast("Rejected"); },
    });
  }
  for (const r of regs.filter((x) => x.status === "pending")) {
    const own = r.employeeId === me.id;
    if (!own && !can(r.employeeId)) continue;
    rows.push({
      id: r.id,
      kind: "time",
      title: `Regularisation · ${formatDay(r.date)}`,
      sub: r.reason,
      who: nameOf(r.employeeId),
      own,
      approve: own ? undefined : () => { decideReg(r.id, "approved"); toast.success("Approved"); },
      reject: own ? undefined : () => { decideReg(r.id, "rejected"); toast("Rejected"); },
    });
  }
  for (const c of claims.filter((x) => x.status === "pending")) {
    const own = c.employeeId === me.id;
    const claimDecide = role ? claimApproverRole(c.amount).includes(role) : false;
    if (!own && !claimDecide) continue;
    if (!own && !can(c.employeeId) && role !== "finance_approver") continue;
    rows.push({
      id: c.id,
      kind: "claim",
      title: `${c.type.toUpperCase()} · ${inr(c.amount)}`,
      sub: `${c.description}${c.bills ? ` · ${c.bills} bill${c.bills > 1 ? "s" : ""}` : ""}`,
      who: nameOf(c.employeeId),
      own,
      approve: own || !claimDecide ? undefined : () => { decideClaim(c.id, "approved"); toast.success("Approved"); },
      reject: own || !claimDecide ? undefined : () => { decideClaim(c.id, "rejected"); toast("Rejected"); },
      hold: c.amount >= 25000,
    });
  }
  for (const ch of changes.filter((x) => x.status === "pending")) {
    const own = ch.employeeId === me.id;
    const checker = ch.field === "bank" ? role === "finance_approver" || role === "payroll_officer" : role === "hr_admin";
    if (!own && !checker) continue;
    rows.push({
      id: ch.id,
      kind: "claim",
      title: `${ch.field} change`,
      sub: `${ch.from} → ${ch.to}`,
      who: nameOf(ch.employeeId),
      own,
      approve: own || !checker ? undefined : () => { decideChange(ch.id, "approved"); toast.success("Applied"); },
      reject: own || !checker ? undefined : () => { decideChange(ch.id, "rejected"); toast("Rejected"); },
    });
  }

  const todoN = rows.filter((r) => !r.own).length;
  const mineN = rows.filter((r) => r.own).length;
  const scope: Scope = picked ?? (todoN > 0 ? "todo" : "mine");
  const scoped = rows.filter((r) => (scope === "mine" ? r.own : !r.own));
  const filtered = scoped.filter((r) => kind === "all" || r.kind === kind);

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[28px] font-semibold tracking-tight">Inbox</h1>
        </div>
      </div>

      <div className="mb-4 flex gap-2">
        {(
          [
            ["todo", `To-do ${todoN}`],
            ["mine", `Mine ${mineN}`],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            onClick={() => setPicked(id)}
            className={`rounded-full px-4 py-2 text-sm font-semibold ${
              scope === id ? "bg-ink text-white" : "bg-white text-muted"
            }`}
          >
            {label}
          </button>
        ))}
      </div>
      <div className="mb-4 flex gap-2 overflow-x-auto">
        {(
          [
            ["all", "All"],
            ["leave", "Leave"],
            ["time", "Attendance"],
            ["claim", "Claims"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            onClick={() => setKind(id)}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
              kind === id ? "bg-brand-soft text-brand" : "bg-white text-muted"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <ScrollFade className="grid max-h-[min(70vh,720px)] gap-2 pr-1">
        {filtered.length === 0 && (
          <Card className="p-10 text-center text-sm text-muted">
            {scope === "todo" ? "Nothing waiting on you." : "No open requests of yours."}
          </Card>
        )}
        {filtered.map((r) => (
          <Card key={r.id} className="flex flex-wrap items-center gap-3 p-3.5 sm:p-4">
            <Avatar name={r.who} size={40} />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-semibold">{r.own ? "You" : r.who}</p>
                <Badge tone={r.kind === "claim" ? "peach" : r.kind === "leave" ? "lilac" : "muted"}>
                  {r.kind === "time" ? "attendance" : r.kind}
                </Badge>
              </div>
              <p className="text-sm">{r.title}</p>
              <p className="truncate text-xs text-muted">{r.sub}</p>
            </div>
            <div className="flex gap-2">
              {r.own && r.kind === "leave" && r.reject && (
                <Button variant="secondary" onClick={r.reject}>
                  Withdraw
                </Button>
              )}
              {!r.own && r.reject && (
                <Button variant="secondary" onClick={r.reject}>
                  Reject
                </Button>
              )}
              {!r.own && r.approve && r.hold && (
                <HoldToConfirm label="Hold to approve" doneLabel="Approved" onConfirm={r.approve} />
              )}
              {!r.own && r.approve && !r.hold && (
                <Button onClick={r.approve}>Approve</Button>
              )}
            </div>
          </Card>
        ))}
      </ScrollFade>
    </div>
  );
}

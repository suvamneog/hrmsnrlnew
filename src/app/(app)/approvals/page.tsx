"use client";

import { TodayList, useToday } from "@/components/home/today";
import { Badge } from "@/components/shadcn/badge";
import { cn } from "@/lib/cn";
import { withUndo } from "@/lib/undo";
import { Checkbox } from "@/components/shadcn/checkbox";
import { Input } from "@/components/shadcn/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/shadcn/tabs";
import { ToggleGroup, ToggleGroupItem } from "@/components/shadcn/toggle-group";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { HoldToConfirm } from "@/components/ui/hold-to-confirm";
import { MagnifyingGlass, Tray } from "@phosphor-icons/react";
import { canDecideFor, claimApproverRole } from "@/lib/access";
import { formatDay, inr } from "@/lib/format";
import { useCurrentUser, useHrms } from "@/lib/store";
import { useMemo, useState } from "react";
import { toast } from "sonner";

type Kind = "all" | "leave" | "time" | "claim" | "change";
type Scope = "todo" | "mine" | "desks";

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
  // What the approver needs to decide without opening anything: balance left, who else is off.
  facts?: { text: string; tone: "ok" | "warn" }[];
};

export default function ApprovalsPage() {
  const me = useCurrentUser();
  const employees = useHrms((s) => s.employees);
  const types = useHrms((s) => s.leaveTypes);
  const leaves = useHrms((s) => s.leaveRequests);
  const balances = useHrms((s) => s.leaveBalances);
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
  const advances = useHrms((s) => s.advances);
  const decideAdvance = useHrms((s) => s.decideAdvance);
  const role = useHrms((s) => s.actingRole);
  const [picked, setPicked] = useState<Scope | null>(null);
  const [q, setQ] = useState("");
  const [sel, setSel] = useState<Set<string>>(new Set());
  const today = useToday();
  const [kind, setKind] = useState<Kind>("all");
  const meId = me?.id;
  const teamIds = useMemo(
    () => new Set(employees.filter((e) => e.managerId === meId).map((e) => e.id)),
    [employees, meId],
  );
  if (!me) return null;

  const can = (empId: string) => canDecideFor(role, me.id, empId, teamIds);

  const nameOf = (id: string) => employees.find((e) => e.id === id)?.name ?? id;

  // Balance after this request, and how many of the same manager's team are already off on those days.
  const leaveFacts = (l: (typeof leaves)[number]): Row["facts"] => {
    const bal = balances.find((b) => b.employeeId === l.employeeId && b.typeId === l.typeId)?.balance;
    const mgr = employees.find((e) => e.id === l.employeeId)?.managerId;
    const off = new Set(
      leaves
        .filter((x) => x.id !== l.id && x.employeeId !== l.employeeId && (x.status === "approved" || x.status === "pending") && x.from <= l.to && x.to >= l.from)
        .filter((x) => employees.find((e) => e.id === x.employeeId)?.managerId === mgr)
        .map((x) => x.employeeId),
    ).size;
    const out: NonNullable<Row["facts"]> = [];
    if (bal !== undefined) out.push({ text: `${bal - l.days} ${types.find((t) => t.id === l.typeId)?.code ?? ""} left after`, tone: bal - l.days < 0 ? "warn" : "ok" });
    out.push(off ? { text: `${off} other${off > 1 ? "s" : ""} in the team off then`, tone: "warn" } : { text: "Nobody else in the team off", tone: "ok" });
    return out;
  };

  const rows: Row[] = [];
  for (const l of leaves.filter((x) => x.status === "pending")) {
    const own = l.employeeId === me.id;
    if (!own && !can(l.employeeId)) continue;
    rows.push({
      id: l.id,
      kind: "leave",
      title: `${types.find((t) => t.id === l.typeId)?.name ?? "Leave"}, ${l.days}d`,
      sub: `${formatDay(l.from)}${l.from !== l.to ? ` – ${formatDay(l.to)}` : ""}, ${l.reason}`,
      who: nameOf(l.employeeId),
      own,
      facts: own ? undefined : leaveFacts(l),
      approve: own ? undefined : () => { decideLeave(l.id, "approved"); toast.success("Approved"); },
      reject: own
        ? () => withUndo("Withdrawn", () => withdraw(l.id))
        : () => withUndo("Rejected", () => decideLeave(l.id, "rejected")),
    });
  }
  for (const s of swaps.filter((x) => x.status === "pending")) {
    const own = s.fromId === me.id || s.toId === me.id;
    if (!own && !can(s.fromId)) continue;
    rows.push({
      id: s.id,
      kind: "time",
      title: `Shift swap, ${formatDay(s.date)}`,
      sub: `${nameOf(s.fromId)} with ${nameOf(s.toId)}`,
      who: nameOf(s.fromId),
      own,
      approve: own ? undefined : () => { decideSwap(s.id, "approved"); toast.success("Approved"); },
      reject: own ? undefined : () => withUndo("Rejected", () => decideSwap(s.id, "rejected")),
    });
  }
  for (const r of regs.filter((x) => x.status === "pending")) {
    const own = r.employeeId === me.id;
    if (!own && !can(r.employeeId)) continue;
    rows.push({
      id: r.id,
      kind: "time",
      title: `Regularisation, ${formatDay(r.date)}`,
      sub: r.reason,
      who: nameOf(r.employeeId),
      own,
      approve: own ? undefined : () => { decideReg(r.id, "approved"); toast.success("Approved"); },
      reject: own ? undefined : () => withUndo("Rejected", () => decideReg(r.id, "rejected")),
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
      title: `${c.type.toUpperCase()}, ${inr(c.amount)}`,
      sub: `${c.description}${c.bills ? `, ${c.bills} bill${c.bills > 1 ? "s" : ""}` : ""}`,
      who: nameOf(c.employeeId),
      own,
      approve: own || !claimDecide ? undefined : () => { decideClaim(c.id, "approved"); toast.success("Approved"); },
      reject: own || !claimDecide ? undefined : () => withUndo("Rejected", () => decideClaim(c.id, "rejected")),
      hold: c.amount >= 25000,
    });
  }
  for (const ch of changes.filter((x) => x.status === "pending")) {
    const own = ch.employeeId === me.id || ch.makerId === me.id;
    const checker =
      ch.field === "bank" || ch.field === "promotion"
        ? role === "finance_approver" || role === "payroll_officer"
        : role === "hr_admin";
    if (!own && !checker) continue;
    rows.push({
      id: ch.id,
      kind: "change",
      title: `${ch.field} change`,
      sub: `${ch.from} → ${ch.to}`,
      who: nameOf(ch.employeeId),
      own,
      approve: own || !checker ? undefined : () => { decideChange(ch.id, "approved"); toast.success("Applied"); },
      reject: own || !checker ? undefined : () => withUndo("Rejected", () => decideChange(ch.id, "rejected")),
    });
  }

  for (const a of advances.filter((x) => x.status === "pending")) {
    const own = a.employeeId === me.id;
    const checker = role === "hr_admin";
    if (!own && !checker) continue;
    rows.push({
      id: a.id,
      kind: "claim",
      title: `${a.type === "hba" ? "House building" : a.type === "vehicle" ? "Vehicle" : "Festival"} advance, ${inr(a.principal)}`,
      sub: `Recover ${inr(a.monthlyRecovery)} a month over ${a.instalments ?? "—"} instalments`,
      who: nameOf(a.employeeId),
      own,
      approve: own || !checker ? undefined : () => { decideAdvance(a.id, "approved"); toast.success("Advance approved. Recovery starts next payroll."); },
      reject: own || !checker ? undefined : () => withUndo("Rejected", () => decideAdvance(a.id, "rejected")),
    });
  }

  const todoN = rows.filter((r) => !r.own).length;
  const mineN = rows.filter((r) => r.own).length;
  // Only work someone has to act on; status lines like the next shift stay on Home.
  const desks = today.filter((t) => t.href !== "/approvals" && !["punch", "next-shift", "my-cases"].includes(t.id));
  const scope: Scope = picked ?? (todoN > 0 ? "todo" : desks.length ? "desks" : "mine");
  const term = q.trim().toLowerCase();
  const visible = rows
    .filter((r) => (scope === "mine" ? r.own : !r.own))
    .filter((r) => kind === "all" || r.kind === kind)
    .filter((r) => !term || `${r.who} ${r.title} ${r.sub}`.toLowerCase().includes(term));
  // Bulk actions cover plain approvals; large claims still need a deliberate hold, one by one.
  const bulkable = visible.filter((r) => !r.own && r.approve && !r.hold);
  const chosen = bulkable.filter((r) => sel.has(r.id));
  const toggle = (id: string) => setSel((prev) => {
    const next = new Set(prev);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    return next;
  });
  function bulk(action: "approve" | "reject") {
    chosen.forEach((r) => (action === "approve" ? r.approve?.() : r.reject?.()));
    toast.success(`${chosen.length} ${action === "approve" ? "approved" : "rejected"}`);
    setSel(new Set());
  }

  const KIND: Record<Exclude<Kind, "all">, string> = { leave: "Leave", time: "Attendance", claim: "Claim or advance", change: "Record change" };

  const list = (
    <div className="rounded-xl border border-line bg-white">
      {scope === "todo" && bulkable.length > 0 && (
        <div className="flex flex-wrap items-center gap-3 border-b border-line px-4 py-2.5">
          <Checkbox
            aria-label="Select all"
            checked={chosen.length === bulkable.length ? true : chosen.length ? "indeterminate" : false}
            onCheckedChange={(v) => setSel(v ? new Set(bulkable.map((r) => r.id)) : new Set())}
          />
          <span className="text-[13px] text-muted">{chosen.length ? `${chosen.length} selected` : "Select to approve or reject together"}</span>
          {chosen.length > 0 && (
            <span className="ml-auto flex gap-2">
              <Button variant="secondary" className="h-8 px-3 text-[13px]" onClick={() => bulk("reject")}>
                Reject
              </Button>
              <Button className="h-8 px-3 text-[13px]" onClick={() => bulk("approve")}>
                {`Approve ${chosen.length}`}
              </Button>
            </span>
          )}
        </div>
      )}
      {visible.length === 0 ? (
        <div className="grid place-items-center gap-2 px-6 py-14 text-center">
          <Tray size={28} className="text-muted" />
          <p className="text-sm font-medium text-ink">{term ? "Nothing matches that search." : scope === "todo" ? "Nothing waiting on you." : "No open requests of yours."}</p>
          <p className="text-[13px] text-muted">{scope === "todo" ? "New requests from your team land here." : "Requests you raise show here until they are decided."}</p>
        </div>
      ) : (
        <ul className="divide-y divide-line">
          {visible.map((r) => {
            const pickable = bulkable.includes(r);
            return (
              <li key={r.id} className={`flex flex-wrap items-center gap-3 px-4 py-3.5 transition-colors ${sel.has(r.id) ? "bg-brand-soft/40" : "hover:bg-subtle"}`}>
                {scope === "todo" && (
                  <Checkbox aria-label={`Select ${r.title}`} disabled={!pickable} checked={sel.has(r.id)} onCheckedChange={() => toggle(r.id)} className={pickable ? "" : "invisible"} />
                )}
                <Avatar name={r.who} size={36} />
                <div className="min-w-0 flex-1 basis-[180px]">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-medium text-ink">{r.own ? "You" : r.who}</p>
                    <Badge variant="secondary" className="rounded-lg font-normal">
                      {KIND[r.kind]}
                    </Badge>
                    {r.hold && (
                      <Badge variant="outline" className="rounded-lg border-warn/30 font-normal text-warn">
                        Finance limit
                      </Badge>
                    )}
                  </div>
                  <p className="mt-0.5 text-sm text-ink">{r.title}</p>
                  <p className="truncate text-[13px] text-muted">{r.sub}</p>
                  {r.facts && (
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      {r.facts.map((f) => (
                        <span key={f.text} className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[12px] font-medium", f.tone === "ok" ? "bg-ok-soft text-ok" : "bg-warn-soft text-[#8a5600]")}>
                          <span className={cn("h-1.5 w-1.5 rounded-full", f.tone === "ok" ? "bg-ok" : "bg-warn")} />
                          {f.text}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                {/* On a phone the actions drop below the request so its text keeps the full width. */}
                <div className="flex shrink-0 gap-2 max-sm:w-full max-sm:justify-end">
                  {r.own && r.kind === "leave" && r.reject && (
                    <Button variant="secondary" className="h-8 px-3 text-[13px]" onClick={r.reject}>
                      Withdraw
                    </Button>
                  )}
                  {!r.own && r.reject && (
                    <Button variant="secondary" className="h-8 px-3 text-[13px]" onClick={r.reject}>
                      Reject
                    </Button>
                  )}
                  {!r.own && r.approve && r.hold && <HoldToConfirm label="Hold to approve" doneLabel="Approved" onConfirm={r.approve} />}
                  {!r.own && r.approve && !r.hold && (
                    <Button className="h-8 px-3 text-[13px]" onClick={r.approve}>
                      Approve
                    </Button>
                  )}
                  {r.own && !r.reject && <Badge variant="outline" className="rounded-lg font-normal text-muted">Waiting</Badge>}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[28px] font-semibold tracking-tight">Inbox</h1>
          <p className="mt-1 text-sm text-muted">
            {`${todoN} waiting on you, ${mineN} of yours open, ${desks.length} from other desks.`}
          </p>
        </div>
        <label className="relative w-full sm:w-64">
          <MagnifyingGlass size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name or request" className="h-9 bg-white pl-9" />
        </label>
      </div>

      <Tabs value={scope} onValueChange={(v) => { setPicked(v as Scope); setSel(new Set()); }}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <TabsList className="bg-fill">
            <TabsTrigger value="todo">{`To do ${todoN}`}</TabsTrigger>
            <TabsTrigger value="mine">{`Mine ${mineN}`}</TabsTrigger>
            <TabsTrigger value="desks">{`Other desks ${desks.length}`}</TabsTrigger>
          </TabsList>
          {scope !== "desks" && (
            <ToggleGroup type="single" value={kind} onValueChange={(v) => v && setKind(v as Kind)} className="flex-wrap">
              {(["all", "leave", "time", "claim", "change"] as const).map((k) => (
                <ToggleGroupItem key={k} value={k} className="h-8 rounded-lg px-2.5 text-[13px] data-[state=on]:bg-fill">
                  {k === "all" ? "All" : KIND[k]}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          )}
        </div>
        <TabsContent value="todo" className="mt-3">{list}</TabsContent>
        <TabsContent value="mine" className="mt-3">{list}</TabsContent>
        <TabsContent value="desks" className="mt-3">
          <TodayList items={desks} title="From other desks" empty="Nothing from other desks needs you." />
        </TabsContent>
      </Tabs>
    </div>
  );
}

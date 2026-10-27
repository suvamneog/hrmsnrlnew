"use client";

import { Card } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { DEMO_TODAY } from "@/lib/demo";
import { daysToLicence } from "@/lib/gate";
import { formatDay } from "@/lib/format";
import { positionTitle } from "@/lib/org";
import { useCurrentUser, useHrms } from "@/lib/store";
import { IdentificationBadge, FirstAidKit, ShieldCheck, Ticket } from "@phosphor-icons/react";
import Link from "next/link";

const STEPS = [
  { key: "police", label: "Police", Icon: IdentificationBadge },
  { key: "medical", label: "Medical", Icon: FirstAidKit },
  { key: "induction", label: "Induction", Icon: ShieldCheck },
  { key: "pass", label: "Pass", Icon: Ticket },
] as const;

export function WorkBoard() {
  const me = useCurrentUser();
  const role = useHrms((s) => s.actingRole);
  const workers = useHrms((s) => s.workers);
  const contractors = useHrms((s) => s.contractors);
  const passes = useHrms((s) => s.passes);
  const employees = useHrms((s) => s.employees);
  const leaves = useHrms((s) => s.leaveRequests);
  const types = useHrms((s) => s.leaveTypes);
  const claims = useHrms((s) => s.claims);
  if (!me || !role) return null;

  const showClearance =
    role === "contract_labour_cell" || role === "safety_officer" || role === "contractor_supervisor" || role === "hr_admin";
  const showCrew = role === "line_manager";
  const showInbox = role === "hr_admin" || role === "finance_approver" || role === "payroll_officer";

  if (!showClearance && !showCrew && !showInbox) return null;

  const mine = role === "contractor_supervisor" ? workers.filter((w) => w.contractorId === "c-lt") : workers;
  const namedNames = new Set(mine.filter((w) => !w.id.startsWith("w-g-")).map((w) => w.name));
  const blocked = mine.filter((w) => passes.find((p) => p.workerId === w.id)?.blocked);
  const queue: typeof blocked = [];
  const seen = new Set<string>();
  for (const w of [...blocked.filter((w) => !w.id.startsWith("w-g-")), ...blocked.filter((w) => w.id.startsWith("w-g-"))]) {
    if (w.id.startsWith("w-g-") && namedNames.has(w.name)) continue;
    if (seen.has(w.name)) continue;
    seen.add(w.name);
    queue.push(w);
    if (queue.length === 4) break;
  }

  const team = employees.filter((e) => e.managerId === me.id);
  const teamIds = new Set(team.map((e) => e.id));
  const leaveInbox = leaves.filter((l) => l.status === "pending" && (l.approverId === me.id || teamIds.has(l.employeeId))).slice(0, 4);
  const claimInbox = claims.filter((c) => c.status === "pending" && c.employeeId !== me.id).slice(0, 3);

  return (
    <div className="grid gap-4 xl:grid-cols-2">
      {showClearance && (
        <Card className="p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-semibold">Plant clearance</h2>
            <Link href="/contractors" className="text-sm font-semibold text-brand">
              Register
            </Link>
          </div>
          {blocked.length > 0 && (
            <p className="mb-3 rounded-2xl bg-[#fff1e6] px-3 py-2 text-[13px] font-medium text-[#c45a12]">
              {blocked.length} not clear to enter
            </p>
          )}
          <ul className="space-y-3">
            {queue.map((w) => {
              const pass = passes.find((p) => p.workerId === w.id);
              const contractor = contractors.find((c) => c.id === w.contractorId);
              const done = {
                police: w.policeVerification,
                medical: w.medicalFitnessExpiry >= DEMO_TODAY,
                induction: w.inductionPassed,
                pass: Boolean(pass && !pass.blocked),
              };
              return (
                <li key={w.id}>
                  <Link href="/contractors" className="flex items-start gap-3 rounded-2xl px-1 py-1 hover:bg-[#f6f8fd]">
                    <Avatar name={w.name} size={36} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate text-sm font-semibold">{w.name}</p>
                        <span className="text-[11px] font-semibold text-muted">{Object.values(done).filter(Boolean).length}/4</span>
                      </div>
                      <p className="truncate text-[12px] text-muted">
                        {w.skill}
                        {contractor ? ` · ${contractor.name.split(" ")[0]}` : ""}
                      </p>
                      <div className="mt-2 flex items-center gap-1.5">
                        {STEPS.map(({ key, label, Icon }, i) => (
                          <span key={key} className="flex items-center gap-1.5">
                            <span
                              title={label}
                              className={`grid h-7 w-7 place-items-center rounded-full ${
                                done[key] ? "bg-[#e7f8ef] text-[#0f9f6e]" : "bg-[#f3f5fb] text-muted"
                              }`}
                            >
                              <Icon size={13} weight={done[key] ? "fill" : "regular"} />
                            </span>
                            {i < STEPS.length - 1 && <span className={`h-px w-3 ${done[key] ? "bg-[#bfe8d2]" : "bg-line"}`} />}
                          </span>
                        ))}
                      </div>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        </Card>
      )}

      {showClearance && (
        <Card className="p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-semibold">Work orders</h2>
            <Link href="/contractors" className="text-sm font-semibold text-brand">
              All
            </Link>
          </div>
          <ul className="space-y-2">
            {contractors.map((c) => {
              const days = daysToLicence(c.licenceExpiry);
              const count = workers.filter((w) => w.contractorId === c.id).length;
              return (
                <li key={c.id}>
                  <Link href="/contractors" className="block rounded-2xl bg-[#f6f8fd] px-3 py-3 transition hover:bg-brand-soft">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold">{c.name}</p>
                        <p className="text-[12px] text-muted">{c.area}</p>
                      </div>
                      <Badge tone={days < 30 ? "warn" : "ok"}>{count} men</Badge>
                    </div>
                    <p className="mt-2 text-[12px] text-muted">
                      Licence {formatDay(c.licenceExpiry)}
                      {days < 30 ? ` · ${days}d left` : ""}
                    </p>
                  </Link>
                </li>
              );
            })}
          </ul>
        </Card>
      )}

      {showCrew && (
        <Card className="p-5 xl:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-semibold">Waiting on you</h2>
            <Link href="/approvals" className="text-sm font-semibold text-brand">
              Inbox
            </Link>
          </div>
          {leaveInbox.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted">Nothing in your inbox.</p>
          ) : (
            <ul className="space-y-2">
              {leaveInbox.map((l) => {
                const who = employees.find((e) => e.id === l.employeeId);
                return (
                  <li key={l.id}>
                    <Link href="/approvals" className="flex items-center gap-3 rounded-2xl bg-[#f6f8fd] px-3 py-2.5">
                      <Avatar name={who?.name ?? ""} size={36} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold">{who?.name}</p>
                        <p className="text-[12px] text-muted">
                          {types.find((t) => t.id === l.typeId)?.name} · {formatDay(l.from)}
                        </p>
                      </div>
                      <Badge tone="warn">leave</Badge>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
      )}

      {showInbox && !showClearance && (
        <Card className="p-5 xl:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-semibold">Waiting on you</h2>
            <Link href="/approvals" className="text-sm font-semibold text-brand">
              Inbox
            </Link>
          </div>
          <ul className="space-y-2">
            {leaveInbox.map((l) => {
              const who = employees.find((e) => e.id === l.employeeId);
              return (
                <li key={l.id}>
                  <Link href="/approvals" className="flex items-center gap-3 rounded-2xl bg-[#f6f8fd] px-3 py-2.5">
                    <Avatar name={who?.name ?? ""} size={36} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">{who?.name}</p>
                      <p className="text-[12px] text-muted">{positionTitle(who?.positionId ?? "")}</p>
                    </div>
                    <Badge tone="warn">leave</Badge>
                  </Link>
                </li>
              );
            })}
            {claimInbox.map((c) => {
              const who = employees.find((e) => e.id === c.employeeId);
              return (
                <li key={c.id}>
                  <Link href="/approvals" className="flex items-center gap-3 rounded-2xl bg-[#f6f8fd] px-3 py-2.5">
                    <Avatar name={who?.name ?? ""} size={36} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">{who?.name}</p>
                      <p className="text-[12px] text-muted">{c.type}</p>
                    </div>
                    <Badge tone="warn">claim</Badge>
                  </Link>
                </li>
              );
            })}
          </ul>
        </Card>
      )}
    </div>
  );
}

"use client";

import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, Input, Select, Textarea } from "@/components/ui/input";
import { formatDay } from "@/lib/format";
import { countLeaveDays } from "@/lib/leave";
import { requestTone } from "@/lib/status";
import { useCurrentUser, useHrms } from "@/lib/store";
import { toast } from "sonner";
import { useMemo, useState } from "react";

export default function LeavePage() {
  const me = useCurrentUser();
  const types = useHrms((s) => s.leaveTypes);
  const balances = useHrms((s) => s.leaveBalances);
  const requests = useHrms((s) => s.leaveRequests);
  const holidays = useHrms((s) => s.holidays);
  const roster = useHrms((s) => s.roster);
  const apply = useHrms((s) => s.applyLeave);
  const withdraw = useHrms((s) => s.withdrawLeave);
  const addLeaveType = useHrms((s) => s.addLeaveType);
  const employees = useHrms((s) => s.employees);
  const role = useHrms((s) => s.actingRole);
  const [typeId, setTypeId] = useState("cl");
  const [from, setFrom] = useState("2026-11-23");
  const [to, setTo] = useState("2026-11-27");
  const [reason, setReason] = useState("");
  const [half, setHalf] = useState<"" | "am" | "pm">("");
  const [newType, setNewType] = useState("Special casual");
  const [newCode, setNewCode] = useState("SCL");
  const days = useMemo(
    () =>
      me
        ? countLeaveDays({
            from,
            to,
            locationId: me.locationId,
            employeeId: me.id,
            holidays,
            roster,
            halfDay: half || undefined,
          })
        : 0,
    [from, to, me, holidays, roster, half],
  );
  if (!me) return null;
  const mine = requests.filter((r) => r.employeeId === me.id);
  const type = types.find((t) => t.id === typeId);
  const bal = balances.find((b) => b.employeeId === me.id && b.typeId === typeId)?.balance ?? 0;

  return (
    <div>
      <PageHeader title="Leave" subtitle="Working days only. Weekly offs and location holidays are excluded. Half-day is 0.5 against the type." />
      <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
        <Card className="p-5">
          <h2 className="mb-4 font-semibold">Apply</h2>
          <form
            className="grid gap-3 sm:grid-cols-2"
            onSubmit={(e) => {
              e.preventDefault();
              const r = apply({ typeId, from, to, reason, halfDay: half || undefined });
              if (!r.ok) toast.error(r.reason);
              else {
                toast.success(`Submitted ${r.days} day(s)`);
                setReason("");
              }
            }}
          >
            <Field label="Type">
              <Select value={typeId} onChange={(e) => setTypeId(e.target.value)}>
                {types.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="From">
              <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
            </Field>
            <Field label="To">
              <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
            </Field>
            {type?.halfDay && (
              <Field label="Half day">
                <Select value={half} onChange={(e) => setHalf(e.target.value as typeof half)}>
                  <option value="">Full days</option>
                  <option value="am">First half</option>
                  <option value="pm">Second half</option>
                </Select>
              </Field>
            )}
            <Field label="Reason">
              <Textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={2} required />
            </Field>
            <div className="sm:col-span-2 flex flex-wrap items-center gap-3">
              <Button type="submit">Submit {days} day{days === 1 ? "" : "s"}</Button>
              <p className="text-xs text-muted">Balance {bal}. Weekly offs and holidays are skipped.</p>
            </div>
          </form>
          <div className="mt-8">
            <h3 className="mb-3 font-semibold">My requests</h3>
            <ul className="space-y-2">
              {mine.map((r) => (
                <li key={r.id} className="flex items-center justify-between rounded-2xl bg-[#f6f8fd] px-3 py-3 text-sm">
                  <span>
                    {types.find((t) => t.id === r.typeId)?.name} · {r.days}d · {formatDay(r.from)}
                    {r.from !== r.to ? ` to ${formatDay(r.to)}` : ""}
                    {r.halfDay ? ` · ${r.halfDay}` : ""}
                  </span>
                  <span className="flex items-center gap-2">
                    <Badge tone={requestTone(r.status)}>{r.status}</Badge>
                    {r.status === "pending" && (
                      <button className="text-xs font-semibold text-brand" onClick={() => withdraw(r.id)}>
                        Withdraw
                      </button>
                    )}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </Card>
        <div className="space-y-3">
          {balances
            .filter((b) => b.employeeId === me.id)
            .map((b) => (
              <Card key={b.typeId} className="p-4">
                <p className="text-xs text-muted">{types.find((t) => t.id === b.typeId)?.name}</p>
                <p className="text-2xl font-semibold">{b.balance}</p>
              </Card>
            ))}
          <p className="text-xs text-muted">Approver: {employees.find((e) => e.id === me.managerId)?.name ?? "HR"}</p>
          {role === "hr_admin" && (
            <Card className="p-4">
              <p className="mb-2 text-sm font-semibold">Add leave type</p>
              <Input className="mb-2" value={newType} onChange={(e) => setNewType(e.target.value)} />
              <Input className="mb-2" value={newCode} onChange={(e) => setNewCode(e.target.value)} />
              <Button
                variant="secondary"
                onClick={() => {
                  addLeaveType({ name: newType, code: newCode, accrual: 0, carryForward: 0, encashable: false, halfDay: true });
                  toast.success("Type added");
                }}
              >
                Save type
              </Button>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

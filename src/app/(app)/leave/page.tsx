"use client";

import { LeaveCharts } from "@/components/charts/page-charts";

import { ATT_DOT } from "@/components/calendar/status-month";

const DOT = "relative after:absolute after:bottom-0.5 after:left-1/2 after:h-1 after:w-1 after:-translate-x-1/2 after:rounded-full";
const dayList = (marks: Map<string, { dot: string }>, dot: string) =>
  [...marks].filter(([, m]) => m.dot === dot).map(([d]) => parseISO(d));
import { PageHeader } from "@/components/layout/page-header";
import { AnimatedGroup } from "@/components/motion/animated-group";
import { InView } from "@/components/motion/in-view";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { DatePicker } from "@/components/ui/date-picker";
import { Field, Input, Select, Textarea } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { formatDay } from "@/lib/format";
import { countLeaveDays, eachDate } from "@/lib/leave";
import { requestTone } from "@/lib/status";
import { useCurrentUser, useHrms } from "@/lib/store";
import { format, parseISO } from "date-fns";
import type { DateRange } from "react-day-picker";
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
  const [to, setTo] = useState("2026-11-24");
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
  const mine = useMemo(() => requests.filter((r) => r.employeeId === me?.id), [requests, me]);
  const marks = useMemo(() => {
    const map = new Map<string, { dot: string }>();
    if (!me) return map;
    for (const h of holidays) {
      if (!h.locationId || h.locationId === me.locationId) map.set(h.date, { dot: ATT_DOT.holiday });
    }
    for (const r of roster) {
      if (r.employeeId === me.id && r.shiftId === "OFF") map.set(r.date, { dot: ATT_DOT.weekly_off });
    }
    for (const r of mine) {
      if (r.status === "withdrawn" || r.status === "rejected") continue;
      for (const d of eachDate(r.from, r.to)) {
        map.set(d, { dot: r.status === "approved" ? ATT_DOT.leave : ATT_DOT.od });
      }
    }
    return map;
  }, [holidays, roster, mine, me]);
  if (!me) return null;
  const type = types.find((t) => t.id === typeId);
  const bal = balances.find((b) => b.employeeId === me.id && b.typeId === typeId)?.balance ?? 0;
  const range: DateRange = { from: parseISO(from), to: parseISO(to) };

  return (
    <div>
      <PageHeader title="Leave"
        subtitle="Balances and requests under NRL leave rules, approved by your reporting officer." />
      <LeaveCharts />
      <div className="grid grid-cols-1 gap-5 *:min-w-0 lg:grid-cols-[1.15fr_320px]">
        <InView>
        <Card className="p-5">
          <h2 className="mb-4 font-semibold">Apply</h2>
          <form
            className="grid grid-cols-1 gap-3 *:min-w-0 sm:grid-cols-2"
            onSubmit={(e) => {
              e.preventDefault();
              const r = apply({ typeId, from, to, reason, halfDay: half || undefined });
              if (!r.ok) toast.error(r.reason);
              else {
                toast.success(`Sent to your manager: ${r.days} ${r.days === 1 ? "day" : "days"}`);
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
            {type?.halfDay ? (
              <Field label="Half day">
                <Select value={half} onChange={(e) => setHalf(e.target.value as typeof half)}>
                  <option value="">Full days</option>
                  <option value="am">First half</option>
                  <option value="pm">Second half</option>
                </Select>
              </Field>
            ) : (
              <div />
            )}
            <Field label="From">
              <DatePicker value={from} onChange={(iso) => {
                setFrom(iso);
                if (iso > to) setTo(iso);
              }} />
            </Field>
            <Field label="To">
              <DatePicker value={to} onChange={(iso) => {
                setTo(iso);
                if (iso < from) setFrom(iso);
              }} />
            </Field>
            <div className="sm:col-span-2 rounded-xl border border-line bg-[#f8f9fd] p-3">
              <Calendar
                mode="range"
                selected={range}
                defaultMonth={parseISO(from)}
                numberOfMonths={1}
                onSelect={(next) => {
                  if (!next?.from) return;
                  setFrom(format(next.from, "yyyy-MM-dd"));
                  setTo(format((next.to ?? next.from), "yyyy-MM-dd"));
                }}
                // One calendar: pick the range on it and see holidays, offs and your leave as dots.
                modifiers={{
                  holiday: dayList(marks, ATT_DOT.holiday),
                  off: dayList(marks, ATT_DOT.weekly_off),
                  booked: dayList(marks, ATT_DOT.leave),
                }}
                modifiersClassNames={{
                  holiday: `${DOT} after:bg-warn`,
                  off: `${DOT} after:bg-faint`,
                  booked: `${DOT} after:bg-brand`,
                }}
                className="mx-auto"
              />
            <ul className="mt-2 justify-center flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-muted">
              <li className="inline-flex items-center gap-1.5"><span className={`h-1.5 w-1.5 rounded-full ${ATT_DOT.leave}`} />Your leave</li>
              <li className="inline-flex items-center gap-1.5"><span className={`h-1.5 w-1.5 rounded-full ${ATT_DOT.holiday}`} />Holiday</li>
              <li className="inline-flex items-center gap-1.5"><span className={`h-1.5 w-1.5 rounded-full ${ATT_DOT.weekly_off}`} />Weekly off</li>
            </ul>
            </div>
            <Field label="Reason">
              <Textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={2} required />
            </Field>
            <div className="flex flex-wrap items-center gap-3 self-end">
              <Button type="submit">Submit {days} day{days === 1 ? "" : "s"}</Button>
              <p className="text-xs text-muted">Balance {bal}{type?.maxPerSpell ? `, up to ${type.maxPerSpell} days at a time` : ""}</p>
            </div>
          </form>
          <div className="mt-8">
            <h3 className="mb-3 font-semibold">My requests</h3>
            <ul className="space-y-2">
              {mine.map((r) => (
                <li key={r.id} className="flex items-center justify-between rounded-xl bg-subtle px-3 py-3 text-sm">
                  <span>
                    {types.find((t) => t.id === r.typeId)?.name}, {r.days}d, {formatDay(r.from)}
                    {r.from !== r.to ? ` to ${formatDay(r.to)}` : ""}
                    {r.halfDay ? `, ${r.halfDay}` : ""}
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
        </InView>
        <AnimatedGroup preset="slide" className="space-y-3">
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
            <InView>
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
            </InView>
          )}
        </AnimatedGroup>
      </div>
    </div>
  );
}

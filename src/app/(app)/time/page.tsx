"use client";

import { TimeCharts } from "@/components/charts/page-charts";

import { ATT_DOT, StatusMonth } from "@/components/calendar/status-month";
import { PunchCard } from "@/components/ess/punch-card";
import type { Punch } from "@/lib/types";
import { Columns, Fact, Ring } from "@/components/home/viz";
import { PageHeader } from "@/components/layout/page-header";
import { HeroCard } from "@/components/ui/hero-card";
import { AnimatedGroup } from "@/components/motion/animated-group";
import { InView } from "@/components/motion/in-view";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import { Field, Textarea } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DEMO_TODAY } from "@/lib/demo";
import { formatClock, formatDay, formatWeekday } from "@/lib/format";
import { attTone } from "@/lib/status";
import { useCurrentUser, useHrms } from "@/lib/store";
import Link from "next/link";
import { shiftFlags } from "@/lib/time-rules";
import { parseISO } from "date-fns";
import { toast } from "sonner";
import { useMemo, useState } from "react";

const LEGEND = [
  ["present", "Present"],
  ["weekly_off", "Weekly off"],
  ["holiday", "Holiday"],
  ["leave", "Leave"],
  ["missing_punch", "No check-in"],
] as const;

export default function TimePage() {
  const me = useCurrentUser();
  const employees = useHrms((s) => s.employees);
  const attendance = useHrms((s) => s.attendance);
  const punches = useHrms((s) => s.punches);
  const shifts = useHrms((s) => s.shifts);
  const apply = useHrms((s) => s.applyRegularisation);
  const [date, setDate] = useState(DEMO_TODAY);
  const [reason, setReason] = useState("");
  const mine = useMemo(() => attendance.filter((a) => a.employeeId === me?.id), [attendance, me]);
  const log = useMemo(
    () => mine.filter((a) => a.date.startsWith("2026-10")).slice(-14),
    [mine],
  );
  const run = useHrms((s) => s.payrollRuns[0]);
  const locked = Boolean(run?.lockedAttendance);
  const month = useMemo(() => {
    const days = mine.filter((a) => a.date.startsWith("2026-10"));
    let late = 0;
    let hours = 0;
    let ot = 0;
    const weekly = [0, 0, 0, 0, 0];
    for (const a of days) {
      const f = shiftFlags({ punches, date: a.date, shift: shifts.find((x) => x.id === a.shiftId), employeeId: me?.id ?? "" });
      if (f.lateMinutes) late += 1;
      const h = a.hours || f.hours || 0;
      hours += h;
      ot += f.overtime || a.overtime || 0;
      weekly[Math.min(4, Math.floor((Number(a.date.slice(8)) - 1) / 7))] += h;
    }
    const count = (st: string) => days.filter((a) => a.status === st).length;
    return {
      present: count("present"),
      leave: count("leave"),
      off: count("weekly_off"),
      holidays: count("holiday"),
      missing: count("missing_punch"),
      working: days.filter((a) => a.status !== "weekly_off" && a.status !== "holiday").length,
      late,
      hours,
      ot,
      weeks: weekly.slice(0, Math.floor((Number(DEMO_TODAY.slice(8)) - 1) / 7) + 1).map((v, i) => ({ label: `W${i + 1}`, value: v })),
    };
  }, [mine, punches, shifts, me]);
  const marks = useMemo(() => {
    const map = new Map<string, { dot: string }>();
    for (const a of mine) {
      map.set(a.date, { dot: ATT_DOT[a.status] ?? "bg-muted" });
    }
    return map;
  }, [mine]);
  if (!me) return null;

  const row = mine.find((a) => a.date === date);
  const flags = shiftFlags({
    punches,
    date,
    shift: shifts.find((s) => s.id === row?.shiftId),
    employeeId: me.id,
  });
  const dayPunches = punches
    .filter((p) => p.employeeId === me.id && p.time.startsWith(date))
    .sort((a, b) => a.time.localeCompare(b.time));
  const inn = dayPunches.find((p) => p.kind === "in");
  const out = outAfter(punches, me.id, inn);
  const team = employees.filter((e) => e.managerId === me.id);
  const crewToday = team.map((e) => {
    const a = attendance.find((x) => x.employeeId === e.id && x.date === DEMO_TODAY);
    const flags = shiftFlags({
      punches,
      date: DEMO_TODAY,
      shift: shifts.find((s) => s.id === a?.shiftId),
      employeeId: e.id,
    });
    const day = punches.filter((p) => p.employeeId === e.id && p.time.startsWith(DEMO_TODAY)).sort((a, b) => a.time.localeCompare(b.time));
    return {
      e,
      status: a?.status ?? "—",
      inn: day.find((p) => p.kind === "in"),
      out: outAfter(punches, e.id, day.find((p) => p.kind === "in")),
      ot: flags.overtime || a?.overtime || 0,
    };
  });
  const otMonth = team
    .map((e) => {
      const hours = attendance
        .filter((a) => a.employeeId === e.id && a.date.startsWith("2026-10"))
        .reduce((n, a) => {
          const flags = shiftFlags({
            punches,
            date: a.date,
            shift: shifts.find((s) => s.id === a.shiftId),
            employeeId: e.id,
          });
          return n + (flags.overtime || a.overtime || 0);
        }, 0);
      return { e, hours };
    })
    .filter((r) => r.hours > 0)
    .sort((a, b) => b.hours - a.hours);

  return (
    <div>
      <PageHeader title="Attendance" subtitle="When you came in and left, against your shift" />
      <div className="mb-5 grid gap-5 *:min-w-0 xl:grid-cols-[minmax(0,1.6fr)_minmax(320px,1fr)]">
        <InView>
          <HeroCard
            title={`${month.present} of ${month.working} working days present`}
            action={
              <span
                className={`rounded-lg px-3 py-1.5 text-[12px] font-semibold ${
                  locked ? "bg-fill text-muted" : "bg-ok-soft text-ok"
                }`}
              >
                {locked ? "Locked for payroll" : "Open for corrections"}
              </span>
            }
          >
            <div className="grid gap-8 md:grid-cols-[auto_1fr]">
              <div className="flex items-center gap-6">
                <Ring value={month.present} max={Math.max(1, month.working)} color="#0f9f6e">
                  <div>
                    <p className="text-[28px] font-semibold tabular-nums tracking-tight">
                      {Math.round((month.present / Math.max(1, month.working)) * 100)}%
                    </p>
                    <p className="text-[12px] text-muted">attendance</p>
                  </div>
                </Ring>
                <div className="min-w-[160px]">
                  <Fact label="Hours worked" value={month.hours.toFixed(1)} />
                  <Fact label="Late arrivals" value={month.late} tone={month.late ? "warn" : "ok"} />
                  <Fact label="Days with no check-in" value={month.missing} tone={month.missing ? "danger" : "ok"} />
                  <Fact label="Overtime" value={`${month.ot.toFixed(1)} h`} />
                </div>
              </div>
              <div>
                <p className="mb-1 text-[12px] font-semibold text-muted">Hours by week</p>
                <Columns data={month.weeks} height={92} format={(n) => n.toFixed(0)} />
                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[12px] text-muted">
                  <span>Leave {month.leave}</span>
                  <span>Weekly off {month.off}</span>
                  <span>Holidays {month.holidays}</span>
                </div>
              </div>
            </div>
          </HeroCard>
        </InView>
        <InView delay={0.06}>
          <PunchCard />
        </InView>
      </div>
      <TimeCharts />
      <Tabs defaultValue="month">
        <TabsList>
          <TabsTrigger value="month">Calendar</TabsTrigger>
          <TabsTrigger value="log">Daily log</TabsTrigger>
          {team.length > 0 && <TabsTrigger value="crew">Crew</TabsTrigger>}
        </TabsList>
        <TabsContent value="month">
          <AnimatedGroup preset="slide" className="grid gap-5 md:grid-cols-[minmax(0,1.15fr)_minmax(280px,1fr)]">
            <Card className="p-4 sm:p-5">
              <h2 className="mb-3 font-semibold">October 2026</h2>
              <StatusMonth selected={date} onSelect={setDate} marks={marks} month={parseISO("2026-10-01")} />
              <ul className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-[12px] text-muted">
                {LEGEND.map(([key, label]) => (
                  <li key={key} className="inline-flex items-center gap-1.5">
                    <span className={`h-1.5 w-1.5 rounded-full ${ATT_DOT[key]}`} />
                    {label}
                  </li>
                ))}
              </ul>
            </Card>
            <div className="space-y-5">
              <Card className="p-5">
                <p className="text-xs font-semibold text-muted">{formatWeekday(date)}</p>
                <div className="mt-2 flex items-center gap-2">
                  <h2 className="font-semibold">{formatDay(date)}</h2>
                  {row ? <Badge tone={attTone(row.status)}>{row.status.replace("_", " ")}</Badge> : <Badge>No record</Badge>}
                </div>
                <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
                  <div className="rounded-xl bg-subtle px-3 py-3">
                    <p className="text-[12px] font-semibold text-muted">In</p>
                    <p className="mt-1 font-mono text-base tabular-nums">{inn ? formatClock(inn.time) : "—"}</p>
                  </div>
                  <div className="rounded-xl bg-subtle px-3 py-3">
                    <p className="text-[12px] font-semibold text-muted">Out</p>
                    <p className="mt-1 font-mono text-base tabular-nums">{out ? formatClock(out.time) : "—"}</p>
                  </div>
                  <div className="rounded-xl bg-subtle px-3 py-3">
                    <p className="text-[12px] font-semibold text-muted">Hours</p>
                    <p className="mt-1 text-base font-semibold tabular-nums">{flags.hours || row?.hours || "—"}</p>
                  </div>
                  <div className="rounded-xl bg-subtle px-3 py-3">
                    <p className="text-[12px] font-semibold text-muted">OT / late</p>
                    <p className="mt-1 text-sm">
                      {flags.overtime || row?.overtime ? `${flags.overtime || row?.overtime}h OT` : "—"}
                      {flags.lateMinutes ? `, in +${flags.lateMinutes}m` : ""}
                      {flags.earlyMinutes ? `, out −${flags.earlyMinutes}m` : ""}
                    </p>
                  </div>
                </div>
                {inn?.readerId && <p className="mt-3 text-xs text-muted">Recorded at gate machine {inn.readerId}{row?.shiftId ? `, ${shifts.find((s) => s.id === row.shiftId)?.label ?? row.shiftId} shift` : ""}</p>}
              </Card>
              <Card className="p-5">
                <h2 className="mb-3 font-semibold">Correct a missed check-in</h2>
                <form
                  className="grid gap-3"
                  onSubmit={(e) => {
                    e.preventDefault();
                    apply({ employeeId: me.id, date, reason, inTime: "06:10", outTime: "14:05" });
                    toast.success("Sent to shift-in-charge");
                    setReason("");
                  }}
                >
                  <Field label="Date">
                    <DatePicker value={date} onChange={setDate} />
                  </Field>
                  <Field label="Reason">
                    <Textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={3} required />
                  </Field>
                  <Button type="submit">Submit</Button>
                </form>
              </Card>
            </div>
          </AnimatedGroup>
        </TabsContent>
        <TabsContent value="log">
          <div>
          <Card className="overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-subtle text-left text-xs text-muted">
                <tr>
                  <th className="px-4 py-3">Date</th>
                  <th>Shift</th>
                  <th>Hours</th>
                  <th>OT</th>
                  <th>Late / early</th>
                  <th className="px-4">Status</th>
                </tr>
              </thead>
              <tbody>
                {log.map((a) => {
                  const dayFlags = shiftFlags({
                    punches,
                    date: a.date,
                    shift: shifts.find((s) => s.id === a.shiftId),
                    employeeId: me.id,
                  });
                  return (
                    <tr
                      key={a.date}
                      className="cursor-pointer border-t border-line hover:bg-brand-soft/50"
                      onClick={() => setDate(a.date)}
                    >
                      <td className="px-4 py-2.5">{formatDay(a.date)}</td>
                      <td>{a.shiftId}</td>
                      <td>{dayFlags.hours || a.hours}</td>
                      <td>{dayFlags.overtime || a.overtime || "—"}</td>
                      <td className="text-xs text-muted">
                        {dayFlags.lateMinutes ? `in +${dayFlags.lateMinutes}m` : ""}
                        {dayFlags.earlyMinutes ? ` out −${dayFlags.earlyMinutes}m` : ""}
                        {!dayFlags.lateMinutes && !dayFlags.earlyMinutes ? "—" : ""}
                      </td>
                      <td className="px-4">
                        <Badge tone={attTone(a.status)}>{a.status.replace("_", " ")}</Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </Card>
          </div>
        </TabsContent>
        {team.length > 0 && (
          <TabsContent value="crew">
            <div className="grid gap-5 lg:grid-cols-2">
              <Card className="overflow-hidden">
                <h2 className="px-4 pt-4 font-semibold">Crew today</h2>
                <table className="mt-2 w-full text-sm">
                  <thead className="text-left text-xs text-muted">
                    <tr>
                      <th className="px-4 py-2">Name</th>
                      <th>Status</th>
                      <th>In</th>
                      <th>Out</th>
                      <th className="px-4">OT</th>
                    </tr>
                  </thead>
                  <tbody>
                    {crewToday.map((row) => (
                      <tr key={row.e.id} className="border-t border-line">
                        <td className="px-4 py-2">
                          <Link href={`/people/${row.e.id}`} className="font-semibold">
                            {row.e.preferredName}
                          </Link>
                        </td>
                        <td className="capitalize">{row.status.replace("_", " ")}</td>
                        <td className="font-mono text-xs">{row.inn ? formatClock(row.inn.time) : "—"}</td>
                        <td className="font-mono text-xs">{row.out ? formatClock(row.out.time) : "—"}</td>
                        <td className="px-4 tabular-nums">{row.ot || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Card>
              <Card className="p-5">
                <h2 className="mb-3 font-semibold">Overtime October</h2>
                {otMonth.length === 0 ? (
                  <p className="text-sm text-muted">No overtime this month.</p>
                ) : (
                  <ul className="space-y-2">
                    {otMonth.map((r) => (
                      <li key={r.e.id} className="flex items-center justify-between text-sm">
                        <span>{r.e.preferredName}</span>
                        <span className="tabular-nums font-semibold">{Number(r.hours.toFixed(1))}h</span>
                      </li>
                    ))}
                  </ul>
                )}
              </Card>
            </div>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}

// A night shift's out-punch lands the next morning, and the morning's first out belongs to yesterday's shift.
function outAfter(punches: Punch[], employeeId: string, inn: Punch | undefined) {
  if (!inn) return undefined;
  return punches
    .filter((p) => p.employeeId === employeeId && p.kind === "out" && p.time > inn.time)
    .sort((a, b) => a.time.localeCompare(b.time))[0];
}

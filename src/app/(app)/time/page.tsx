"use client";

import { ATT_DOT, StatusMonth } from "@/components/calendar/status-month";
import { PunchCard } from "@/components/ess/punch-card";
import { PageHeader } from "@/components/layout/page-header";
import { AnimatedGroup } from "@/components/motion/animated-group";
import { InView } from "@/components/motion/in-view";
import { ScrollReveal } from "@/components/motion/scroll-reveal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import { Field, Textarea } from "@/components/ui/input";
import { SpotlightCard } from "@/components/ui/spotlight-card";
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
  ["missing_punch", "Missing punch"],
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
  const out = [...dayPunches].reverse().find((p) => p.kind === "out");
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
      out: [...day].reverse().find((p) => p.kind === "out"),
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
      <PageHeader title="Attendance" />
      <InView delay={0.04} className="mb-5 max-w-xl">
        <PunchCard />
      </InView>
      <Tabs defaultValue="month">
        <TabsList>
          <TabsTrigger value="month">Calendar</TabsTrigger>
          <TabsTrigger value="log">Daily log</TabsTrigger>
          {team.length > 0 && <TabsTrigger value="crew">Crew</TabsTrigger>}
        </TabsList>
        <TabsContent value="month">
          <AnimatedGroup preset="slide" className="grid gap-5 md:grid-cols-[minmax(0,1.15fr)_minmax(280px,1fr)]">
            <SpotlightCard className="p-4 sm:p-5">
              <h2 className="mb-3 font-semibold">October 2026</h2>
              <StatusMonth selected={date} onSelect={setDate} marks={marks} month={parseISO("2026-10-01")} />
              <ul className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-[11px] text-muted">
                {LEGEND.map(([key, label]) => (
                  <li key={key} className="inline-flex items-center gap-1.5">
                    <span className={`h-1.5 w-1.5 rounded-full ${ATT_DOT[key]}`} />
                    {label}
                  </li>
                ))}
              </ul>
            </SpotlightCard>
            <div className="space-y-5">
              <SpotlightCard className="p-5">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted">{formatWeekday(date)}</p>
                <div className="mt-2 flex items-center gap-2">
                  <h2 className="font-semibold">{formatDay(date)}</h2>
                  {row ? <Badge tone={attTone(row.status)}>{row.status.replace("_", " ")}</Badge> : <Badge>No record</Badge>}
                </div>
                <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
                  <div className="rounded-2xl bg-[#f6f8fd] px-3 py-3">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">In</p>
                    <p className="mt-1 font-mono text-base tabular-nums">{inn ? formatClock(inn.time) : "—"}</p>
                  </div>
                  <div className="rounded-2xl bg-[#f6f8fd] px-3 py-3">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">Out</p>
                    <p className="mt-1 font-mono text-base tabular-nums">{out ? formatClock(out.time) : "—"}</p>
                  </div>
                  <div className="rounded-2xl bg-[#f6f8fd] px-3 py-3">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">Hours</p>
                    <p className="mt-1 text-base font-semibold tabular-nums">{flags.hours || row?.hours || "—"}</p>
                  </div>
                  <div className="rounded-2xl bg-[#f6f8fd] px-3 py-3">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">OT / late</p>
                    <p className="mt-1 text-sm">
                      {flags.overtime || row?.overtime ? `${flags.overtime || row?.overtime}h OT` : "—"}
                      {flags.lateMinutes ? ` · in +${flags.lateMinutes}m` : ""}
                      {flags.earlyMinutes ? ` · out −${flags.earlyMinutes}m` : ""}
                    </p>
                  </div>
                </div>
                {inn?.readerId && <p className="mt-3 text-xs text-muted">Reader {inn.readerId}{row?.shiftId ? ` · shift ${row.shiftId}` : ""}</p>}
              </SpotlightCard>
              <SpotlightCard className="p-5">
                <h2 className="mb-3 font-semibold">Regularise a punch</h2>
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
              </SpotlightCard>
            </div>
          </AnimatedGroup>
        </TabsContent>
        <TabsContent value="log">
          <ScrollReveal>
          <SpotlightCard className="overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-[#f6f8fd] text-left text-xs text-muted">
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
          </SpotlightCard>
          </ScrollReveal>
        </TabsContent>
        {team.length > 0 && (
          <TabsContent value="crew">
            <div className="grid gap-5 lg:grid-cols-2">
              <SpotlightCard className="overflow-hidden">
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
              </SpotlightCard>
              <SpotlightCard className="p-5">
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
              </SpotlightCard>
            </div>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}

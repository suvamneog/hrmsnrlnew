"use client";

import { Bars, C, ChartCard } from "@/components/charts/kit";
import { Field, Grid2, Panel, Pill, Rows, Stats } from "@/components/desk/kit";
import { MIN_MANNING } from "@/components/home/dashboard-charts";
import { PageHeader } from "@/components/layout/page-header";
import { OvertimeAndHandover } from "@/components/shift/overtime-handover";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/cn";
import { DEMO_TODAY } from "@/lib/demo";
import { useDesk } from "@/lib/desk";
import { SHIFT_CHANGE, crewInside, lapseImpact, overtimeByDay, shiftExceptions } from "@/lib/desk-analytics";
import { formatDay } from "@/lib/format";
import { useCurrentUser, useHrms } from "@/lib/store";
import { addDays, format, parseISO } from "date-fns";
import Link from "next/link";
import { useMemo, useState } from "react";
import { toast } from "sonner";

const ISSUE = {
  late: { label: "Late", tone: "warn" },
  absent: { label: "Not in", tone: "danger" },
  leave: { label: "On leave", tone: "muted" },
  ok: { label: "In", tone: "ok" },
} as const;

export default function ShiftDeskPage() {
  const me = useCurrentUser();
  const role = useHrms((s) => s.actingRole);
  const employees = useHrms((s) => s.employees);
  const roster = useHrms((s) => s.roster);
  const shifts = useHrms((s) => s.shifts);
  const attendance = useHrms((s) => s.attendance);
  const punches = useHrms((s) => s.punches);
  const leave = useHrms((s) => s.leaveRequests);
  const certs = useHrms((s) => s.certificates);
  const settings = useHrms((s) => s.settings);
  const delegation = useDesk((s) => s.delegation);
  const delegate = useDesk((s) => s.delegate);
  const [to, setTo] = useState("");
  const [until, setUntil] = useState("2026-11-07");

  const team = useMemo(() => {
    if (!me) return [];
    const mine = employees.filter((e) => e.managerId === me.id);
    return mine.length && role === "line_manager" ? mine : employees.filter((e) => e.crew);
  }, [employees, me, role]);
  const ids = useMemo(() => new Set(team.map((e) => e.id)), [team]);
  const rows = useMemo(
    () => shiftExceptions({ people: team, roster, shifts, attendance, punches, leave }),
    [team, roster, shifts, attendance, punches, leave],
  );
  // Manning is judged on everyone rostered on the shift, not only this manager's reports.
  const plant = useMemo(
    () => shiftExceptions({ people: employees.filter((e) => e.crew), roster, shifts, attendance, punches, leave }),
    [employees, roster, shifts, attendance, punches, leave],
  );
  const ot = useMemo(() => overtimeByDay(attendance, employees, settings, 14, ids), [attendance, employees, settings, ids]);
  const lapses = useMemo(() => lapseImpact({ people: team, roster, certs, min: MIN_MANNING }), [team, roster, certs]);
  if (!me) return null;

  const name = (id: string) => employees.find((e) => e.id === id)?.preferredName ?? id;



  const week = Array.from({ length: 7 }, (_, i) => format(addDays(parseISO(DEMO_TODAY), i), "yyyy-MM-dd")).map((date) => ({
    date,
    away: team.flatMap((e): { name: string; why: "Leave" | "Waiting" | "Off" }[] => {
      const l = leave.find((x) => x.employeeId === e.id && (x.status === "approved" || x.status === "pending") && x.from <= date && x.to >= date);
      if (l) return [{ name: e.preferredName, why: l.status === "approved" ? ("Leave" as const) : ("Waiting" as const) }];
      const off = roster.find((r) => r.employeeId === e.id && r.date === date)?.shiftId === "OFF";
      return off ? [{ name: e.preferredName, why: "Off" as const }] : [];
    }),
  }));
  const count = (k: keyof typeof ISSUE) => rows.filter((r) => r.issue === k).length;
  const colleagues = employees.filter((e) => e.id !== me.id && e.cadre === "executive" && !e.id.startsWith("g-")).slice(0, 10);
  const otHours = ot.reduce((n, r) => n + r.hours, 0);

  return (
    <div className="space-y-6">
      <PageHeader title="Shift desk" subtitle={`CDU / NDU crews A to D: who is in, late or missing at 06:00, 14:00 and 22:00, ${formatDay(DEMO_TODAY)}.`} />

      <Stats
        items={[
          { label: "Rostered today", value: rows.length },
          { label: "Late", value: count("late"), tone: count("late") ? "warn" : "ok" },
          { label: "Not in", value: count("absent"), tone: count("absent") ? "danger" : "ok" },
          { label: "Crew inside now", value: crewInside(team, punches), hint: `${count("leave")} on leave` },
        ]}
      />

      <Panel title="Changeover exceptions" note={`Minimum manning is ${MIN_MANNING} per shift (demo value, to confirm with NRL).`}>
        <Tabs defaultValue="M">
          <TabsList>
            {SHIFT_CHANGE.map((s) => (
              <TabsTrigger key={s.code} value={s.code}>
                {s.at}
              </TabsTrigger>
            ))}
          </TabsList>
          {SHIFT_CHANGE.map((s) => {
            const list = rows.filter((r) => r.shift === s.code);
            const all = plant.filter((r) => r.shift === s.code);
            const manned = all.filter((r) => r.issue === "ok" || r.issue === "late").length;
            const short = all.length > 0 && manned < MIN_MANNING;
            return (
              <TabsContent key={s.code} value={s.code}>
                <div className="mb-2 flex flex-wrap items-center gap-2 text-[13px] text-muted">
                  <span>
                    {s.label} shift, plant-wide: {manned} of {all.length} in
                  </span>
                  {short && <Pill tone="danger">Below minimum</Pill>}
                </div>
                <Rows
                  items={[...list].sort((a, b) => Number(a.issue === "ok") - Number(b.issue === "ok"))}
                  empty="Nobody from this team is rostered on this shift today."
                  render={(r) => (
                    <>
                      <div className="flex min-w-0 items-center gap-3">
                        <Avatar name={r.employee.name} size={34} />
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-ink">{r.employee.name}</p>
                          <p className="text-[12px] text-muted">Crew {r.employee.crew ?? "day"}</p>
                        </div>
                      </div>
                      <Pill tone={ISSUE[r.issue].tone}>
                        {ISSUE[r.issue].label}
                        {r.minutes ? `, ${r.minutes} min` : ""}
                      </Pill>
                    </>
                  )}
                />
              </TabsContent>
            );
          })}
        </Tabs>
      </Panel>

      <Grid2>
        {/* Who is away over the next week, so leave can be judged against cover. Approvals live in the Inbox. */}
        <Panel
          title="Who is off, next 7 days"
          note="Leave (approved or waiting) and weekly offs in your team. Approve requests in the Inbox."
          action={
            <Link href="/approvals" className="text-[13px] font-semibold text-brand">
              Open Inbox
            </Link>
          }
        >
          <ul className="divide-y divide-fill">
            {week.map((d) => (
              <li key={d.date} className="flex items-start gap-3 py-2.5">
                <span className={cn("w-16 shrink-0 text-[13px] font-semibold", d.date === DEMO_TODAY ? "text-brand" : "text-ink")}>
                  {d.date === DEMO_TODAY ? "Today" : format(parseISO(d.date), "EEE d")}
                </span>
                <span className="flex min-w-0 flex-1 flex-wrap gap-1.5">
                  {d.away.length === 0 ? (
                    <span className="text-[13px] text-muted">Everyone in</span>
                  ) : (
                    d.away.map((x) => (
                      <span
                        key={x.name}
                        className={cn(
                          "rounded-full px-2.5 py-0.5 text-[12px] font-medium",
                          x.why === "Leave" ? "bg-brand-soft text-brand" : x.why === "Waiting" ? "bg-warn-soft text-[#8a5600]" : "bg-fill text-muted",
                        )}
                      >
                        {x.name}
                        <span className="opacity-70"> · {x.why === "Waiting" ? "leave waiting" : x.why === "Leave" ? "leave" : "day off"}</span>
                      </span>
                    ))
                  )}
                </span>
                {d.away.length > 0 && <span className="shrink-0 text-[12px] tabular-nums text-muted">{d.away.length} of {team.length}</span>}
              </li>
            ))}
          </ul>
        </Panel>

        <ChartCard
          title="Overtime hours worked by your team, last 14 days"
          value={`${otHours.toLocaleString("en-IN")} h`}
          note={(() => { const top = [...ot].sort((a, b) => b.hours - a.hours)[0]; return top ? `Most on ${top.day}, ${top.hours} h. Approve requests below before payroll locks; executives earn no overtime.` : "No overtime in the last 14 days."; })()}
          series={[{ key: "hours", label: "Hours", color: C.blue }]}
        >
          <Bars data={ot} x="day" unit="Hours" xUnit="Day" series={[{ key: "hours", label: "Hours", color: C.blue }]} />
        </ChartCard>
      </Grid2>

      <Grid2>
        <Panel title="Certificate lapses next week" note="Shifts that fall below minimum manning if these people cannot enter.">
          <Rows
            items={lapses}
            empty="No shift next week loses minimum manning to a lapsed certificate."
            render={(l) => (
              <>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-ink">
                    {l.day}, {SHIFT_CHANGE.find((s) => s.code === l.shift)?.label} shift
                  </p>
                  <p className="truncate text-[12px] text-muted">Lapsed: {l.lapsed.join(", ")}</p>
                </div>
                <Pill tone="danger">
                  {l.after} of {l.rostered} left
                </Pill>
              </>
            )}
          />
        </Panel>

        <Panel title="Delegate approvals" note="Your inbox goes to a colleague while you are on leave.">
          {delegation && delegation.fromId === me.id ? (
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-ink">
                {name(delegation.toId)} approves for you until {formatDay(delegation.until)}.
              </p>
              <Button variant="secondary" onClick={() => delegate(null)}>
                End delegation
              </Button>
            </div>
          ) : (
            <form
              className="grid gap-4 sm:grid-cols-2"
              onSubmit={(e) => {
                e.preventDefault();
                if (!to) return toast.error("Pick who approves for you.");
                delegate({ fromId: me.id, toId: to, until });
                toast.success(`Delegated to ${name(to)}`);
              }}
            >
              <Field label="Delegate to">
                <Select value={to} onChange={(e) => setTo(e.target.value)}>
                  <option value="">Choose a colleague</option>
                  {colleagues.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Until">
                <Input type="date" value={until} min={DEMO_TODAY} onChange={(e) => setUntil(e.target.value)} />
              </Field>
              <div className="sm:col-span-2">
                <Button type="submit">Delegate</Button>
              </div>
            </form>
          )}
        </Panel>
      </Grid2>
      <OvertimeAndHandover team={team} />
    </div>
  );
}

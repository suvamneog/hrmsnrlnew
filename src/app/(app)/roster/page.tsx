"use client";

import { RosterCharts } from "@/components/charts/page-charts";
import { DayBoard } from "@/components/roster/day-board";

import { StatusMonth } from "@/components/calendar/status-month";
import { SHIFT_STYLE, ShiftIcon, ShiftKey } from "@/lib/shift-style";
import { PageHeader } from "@/components/layout/page-header";
import { AnimatedGroup } from "@/components/motion/animated-group";
import { InView } from "@/components/motion/in-view";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import { Select } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { useCurrentUser, useHrms } from "@/lib/store";
import { DEMO_TODAY } from "@/lib/demo";
import { format, parseISO } from "date-fns";
import { toast } from "sonner";
import { useMemo, useState } from "react";

export default function RosterPage() {
  const me = useCurrentUser();
  const employees = useHrms((s) => s.employees);
  const roster = useHrms((s) => s.roster);
  const applySwap = useHrms((s) => s.applySwap);
  const publishRoster = useHrms((s) => s.publishRoster);
  const editShift = useHrms((s) => s.editShift);
  const shifts = useHrms((s) => s.shifts);
  const role = useHrms((s) => s.actingRole);
  const crew = employees.filter((e) => e.crew && (me?.crew ? e.crew === me.crew || e.managerId === me.id || e.id === me.id : true)).slice(0, 10);
  const [toId, setToId] = useState(crew[0]?.id ?? "");
  const [date, setDate] = useState("2026-11-02");

  const marks = useMemo(() => {
    const map = new Map<string, { stamp: string; stampClass: string }>();
    if (!me) return map;
    for (const r of roster) {
      if (r.employeeId !== me.id) continue;
      map.set(r.date, { stamp: r.shiftId, stampClass: "bg-subtle text-muted" });
    }
    return map;
  }, [roster, me]);

  if (!me) return null;
  return (
    <div>
      <PageHeader
        title="Roster"
        subtitle={`Crew ${me.crew ?? "day"}, ${me.crew ? "CDU and NDU" : "general shift"} · ${format(parseISO(DEMO_TODAY), "EEEE d MMMM yyyy")}`}
        actions={
          role === "line_manager" || role === "hr_admin" ? (
            <Button
              variant="secondary"
              onClick={() => {
                publishRoster("2026-11-01", 14);
                toast.success("November 1–14 published from crew cycle");
              }}
            >
              Generate 14 days
            </Button>
          ) : undefined
        }
      />
      <DayBoard people={crew} meId={me.id} />
      {(role === "line_manager" || role === "hr_admin") && (
        <div className="mb-6 flex flex-wrap items-center gap-2">
          <span className="mr-1 text-[12px] font-semibold text-muted">Shift times</span>
          {shifts.filter((s) => s.code !== "OFF").map((s) => (
            <label key={s.id} className="flex items-center gap-2 rounded-lg bg-white px-3 py-1.5 text-xs">
              <span className="grid h-5 w-5 place-items-center rounded-[6px]" style={{ background: SHIFT_STYLE[s.code]?.bg, color: SHIFT_STYLE[s.code]?.ink }}>
                <ShiftIcon code={s.code} size={11} />
              </span>
              {SHIFT_STYLE[s.code]?.name ?? s.code}
              <input
                className="w-14 rounded-md border border-line px-1"
                defaultValue={s.start}
                onBlur={(e) => editShift(s.id, e.target.value, s.end)}
              />
              <input
                className="w-14 rounded-md border border-line px-1"
                defaultValue={s.end}
                onBlur={(e) => editShift(s.id, s.start, e.target.value)}
              />
            </label>
          ))}
        </div>
      )}
      <RosterCharts />
      <AnimatedGroup preset="slide" className="mt-4 grid gap-4 lg:grid-cols-[1fr_1.1fr]">
        <InView>
        <Card className="p-4">
          <h2 className="mb-2 font-semibold">My shifts</h2>
          <div className="mb-3">
            <ShiftKey codes={["M", "A", "N", "OFF"]} />
          </div>
          <StatusMonth selected={date} onSelect={setDate} marks={marks} month={parseISO("2026-10-01")} />
        </Card>
        </InView>
        <Card className="flex flex-wrap items-end gap-3 p-4">
          <label className="min-w-[180px] flex-1 text-sm">
            Swap with
            <Select className="mt-1" value={toId} onChange={(e) => setToId(e.target.value)}>
              {crew.filter((e) => e.id !== me.id).map((e) => (
                <option key={e.id} value={e.id}>
                  {e.name}
                </option>
              ))}
            </Select>
          </label>
          <label className="min-w-[180px] flex-1 text-sm">
            Date
            <div className="mt-1">
              <DatePicker value={date} onChange={setDate} />
            </div>
          </label>
          <Button
            onClick={() => {
              const r = applySwap({ fromId: me.id, toId, date, approverId: me.managerId ?? me.id });
              if (!r.ok) toast.error(r.reason);
              else toast.success("Swap sent to shift-in-charge");
            }}
          >
            Request swap
          </Button>
        </Card>
      </AnimatedGroup>
    </div>
  );
}

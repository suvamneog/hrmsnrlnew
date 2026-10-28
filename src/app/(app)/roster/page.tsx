"use client";

import { RosterCharts } from "@/components/charts/page-charts";

import { SHIFT_TONE, StatusMonth } from "@/components/calendar/status-month";
import { PageHeader } from "@/components/layout/page-header";
import { AnimatedGroup } from "@/components/motion/animated-group";
import { InView } from "@/components/motion/in-view";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import { Select } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { useCurrentUser, useHrms } from "@/lib/store";
import { Bars } from "@/components/home/viz";
import { HeroCard } from "@/components/ui/hero-card";
import { DEMO_TODAY } from "@/lib/demo";
import { settingOn } from "@/lib/payroll";
import { addDays, format, parseISO } from "date-fns";
import { motion } from "motion/react";
import { toast } from "sonner";
import { useMemo, useState } from "react";

const FALLBACK_DAYS = Array.from({ length: 14 }, (_, i) => `2026-10-${String(i + 20).padStart(2, "0")}`);

export default function RosterPage() {
  const me = useCurrentUser();
  const employees = useHrms((s) => s.employees);
  const roster = useHrms((s) => s.roster);
  const applySwap = useHrms((s) => s.applySwap);
  const publishRoster = useHrms((s) => s.publishRoster);
  const editShift = useHrms((s) => s.editShift);
  const shifts = useHrms((s) => s.shifts);
  const role = useHrms((s) => s.actingRole);
  const settings = useHrms((s) => s.settings);
  const swaps = useHrms((s) => s.swaps);
  const crew = employees.filter((e) => e.crew && (me?.crew ? e.crew === me.crew || e.managerId === me.id || e.id === me.id : true)).slice(0, 10);
  const [toId, setToId] = useState(crew[0]?.id ?? "");
  const [date, setDate] = useState("2026-11-02");

  const DAYS = useMemo(() => {
    const dates = [...new Set(roster.map((r) => r.date))].sort();
    return dates.filter((d) => d >= "2026-10-20").slice(0, 21);
  }, [roster]);
  const days = DAYS.length ? DAYS : FALLBACK_DAYS;
  const grid = useMemo(() => {
    return crew.map((e) => ({
      e,
      cells: days.map((d) => roster.find((r) => r.employeeId === e.id && r.date === d)?.shiftId ?? "—"),
    }));
  }, [crew, roster, days]);
  const marks = useMemo(() => {
    const map = new Map<string, { stamp: string; stampClass: string }>();
    if (!me) return map;
    for (const r of roster) {
      if (r.employeeId !== me.id) continue;
      map.set(r.date, { stamp: r.shiftId, stampClass: SHIFT_TONE[r.shiftId] ?? "bg-[#f6f8fd] text-muted" });
    }
    return map;
  }, [roster, me]);

  if (!me) return null;
  const todayCode = roster.find((r) => r.employeeId === me.id && r.date === DEMO_TODAY)?.shiftId;
  const todayShift = todayCode && todayCode !== "OFF" ? shifts.find((x) => x.id === todayCode) : undefined;
  const next7 = Array.from({ length: 7 }, (_, i) => format(addDays(parseISO(DEMO_TODAY), i + 1), "yyyy-MM-dd")).map((d) => ({
    date: d,
    code: roster.find((r) => r.employeeId === me.id && r.date === d)?.shiftId ?? "—",
  }));
  const minRest = settingOn(settings, "min.rest", DEMO_TODAY, undefined, 11);
  const pendingSwaps = swaps.filter((x) => x.status === "pending" && (x.fromId === me.id || x.approverId === me.id)).length;
  const color: Record<string, string> = {
    M: "bg-[#e7f8ef] text-[#0f9f6e]",
    A: "bg-[#fff1e6] text-[#e07a3d]",
    N: "bg-[#eeeaff] text-[#5b5bd6]",
    G: "bg-[#e8eefc] text-brand",
    OFF: "bg-[#eef1f6] text-muted",
  };

  return (
    <div>
      <PageHeader
        title="Roster"
        subtitle="Crews A to D on the four-crew cycle: morning, afternoon, night and weekly off."
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
      {(role === "line_manager" || role === "hr_admin") && (
        <div className="mb-4 flex flex-wrap gap-2">
          {shifts.filter((s) => s.code !== "OFF").map((s) => (
            <label key={s.id} className="flex items-center gap-2 rounded-full bg-white px-3 py-1.5 text-xs">
              {s.code}
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
      <InView className="mb-5">
        <HeroCard
          eyebrow={`Crew ${me.crew ?? "—"} · four-crew rotation`}
          title={`Today ${todayShift ? `you are on ${todayShift.label.toLowerCase()}` : "you are off"}`}
          action={<span className="rounded-full bg-[#f3f5fb] px-3 py-1.5 text-[12px] font-semibold">Min rest {minRest} h</span>}
        >
          <div className="grid gap-8 md:grid-cols-[1fr_1.2fr]">
            <div>
              <p className="mb-3 text-[12px] font-semibold text-muted">On shift today, this crew view</p>
              <Bars
                rows={shifts
                  .filter((x) => x.code !== "OFF" && x.code !== "G")
                  .map((x) => ({
                    label: `${x.label} · ${x.start}–${x.end}`,
                    value: grid.filter((g) => g.cells[days.indexOf(DEMO_TODAY)] === x.id).length,
                    tone: x.code === "M" ? "#0f9f6e" : x.code === "A" ? "#e07a3d" : "#5b5bd6",
                  }))}
              />
              <p className="mt-3 text-[12px] text-muted">
                Off today {grid.filter((g) => g.cells[days.indexOf(DEMO_TODAY)] === "OFF").length} · swaps waiting {pendingSwaps}
              </p>
            </div>
            <div>
              <p className="mb-3 text-[12px] font-semibold text-muted">Your next 7 days</p>
              <div className="grid grid-cols-7 gap-1.5">
                {next7.map((d, i) => (
                  <motion.div
                    key={d.date}
                    initial={{ opacity: 0, y: 8 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.04 * i, duration: 0.4 }}
                    className={`flex flex-col items-center rounded-2xl px-1 py-2.5 ${color[d.code] ?? "bg-[#f6f8fd] text-muted"}`}
                  >
                    <span className="text-[10px] font-semibold uppercase opacity-70">{format(parseISO(d.date), "EEE")}</span>
                    <span className="text-[15px] font-semibold tabular-nums">{d.date.slice(8)}</span>
                    <span className="mt-1 text-[11px] font-bold">{d.code}</span>
                  </motion.div>
                ))}
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {shifts.filter((x) => x.code !== "OFF").map((x) => (
                  <span key={x.id} className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${color[x.code]}`}>
                    {x.code} {x.start}–{x.end}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </HeroCard>
      </InView>
      <RosterCharts />
      <div>
      <Card className="overflow-x-auto p-4">
        <table className="min-w-max text-xs">
          <thead>
            <tr>
              <th className="sticky left-0 bg-white px-2 py-2 text-left">Crew</th>
              {days.map((d) => (
                <th key={d} className={`px-1 py-2 font-medium ${d === DEMO_TODAY ? "text-brand" : "text-muted"}`}>
                  <span className="block text-[9px] uppercase">{format(parseISO(d), "EEEEE")}</span>
                  {d.slice(8)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {grid.map((row) => (
              <tr key={row.e.id}>
                <td className="sticky left-0 bg-white px-2 py-1 font-semibold">{row.e.preferredName}</td>
                {row.cells.map((c, i) => (
                  <td key={i} className={`px-1 py-1 ${days[i] === DEMO_TODAY ? "bg-brand-soft/60" : ""}`}>
                    <span
                      className={`grid h-8 w-10 place-items-center rounded-lg font-semibold ${color[c] ?? "bg-white"} ${
                        row.e.id === me.id ? "ring-1 ring-brand/40" : ""
                      }`}
                    >
                      {c}
                    </span>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
      </div>
      <AnimatedGroup preset="slide" className="mt-4 grid gap-4 lg:grid-cols-[1fr_1.1fr]">
        <InView>
        <Card className="p-4">
          <h2 className="mb-3 font-semibold">My shifts</h2>
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

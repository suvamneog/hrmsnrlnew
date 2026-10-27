"use client";

import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select } from "@/components/ui/input";
import { useCurrentUser, useHrms } from "@/lib/store";
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

  if (!me) return null;
  const color: Record<string, string> = {
    M: "bg-[#e7f8ef] text-[#0f9f6e]",
    A: "bg-[#fff1e6] text-[#e07a3d]",
    N: "bg-[#eeeaff] text-[#5b5bd6]",
    OFF: "bg-[#eef1f6] text-muted",
  };

  return (
    <div>
      <PageHeader
        title="Roster"
        subtitle="Four-crew rotation. Swaps need the shift-in-charge and a minimum rest check."
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
      <Card className="overflow-x-auto p-4">
        <table className="min-w-max text-xs">
          <thead>
            <tr>
              <th className="sticky left-0 bg-white px-2 py-2 text-left">Crew</th>
              {days.map((d) => (
                <th key={d} className="px-1 py-2 font-medium text-muted">
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
                  <td key={i} className="px-1 py-1">
                    <span className={`grid h-8 w-10 place-items-center rounded-lg font-semibold ${color[c] ?? "bg-white"}`}>{c}</span>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
      <Card className="mt-4 flex flex-wrap items-end gap-3 p-4">
        <label className="text-sm">
          Swap with
          <Select className="mt-1" value={toId} onChange={(e) => setToId(e.target.value)}>
            {crew.filter((e) => e.id !== me.id).map((e) => (
              <option key={e.id} value={e.id}>
                {e.name}
              </option>
            ))}
          </Select>
        </label>
        <label className="text-sm">
          Date
          <input className="mt-1 h-11 rounded-xl border border-line px-3" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
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
    </div>
  );
}

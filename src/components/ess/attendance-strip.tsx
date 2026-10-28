"use client";

import { Card } from "@/components/ui/card";
import { DEMO_TODAY, openPair, punchesOn } from "@/lib/demo";
import { formatClock, formatWeekday } from "@/lib/format";
import { useCurrentUser, useHrms } from "@/lib/store";
import { Fingerprint } from "@phosphor-icons/react";
import Link from "next/link";

/* One-line attendance status for Home. Punches come from the plant's biometric readers, so this only reports. */
export function AttendanceStrip() {
  const me = useCurrentUser();
  const punches = useHrms((s) => s.punches);
  const roster = useHrms((s) => s.roster);
  const shifts = useHrms((s) => s.shifts);
  if (!me) return null;

  const { inn, out, inside } = openPair(punchesOn(punches, me.id));
  const shift = roster.find((r) => r.employeeId === me.id && r.date === DEMO_TODAY);
  const off = shift?.shiftId === "OFF";
  const label = shifts.find((s) => s.id === shift?.shiftId)?.label ?? "General";
  const state = inside ? "In plant" : out ? "Day closed" : off ? "Weekly off" : "Not in yet";
  const dot = inside ? "bg-[#0f9f6e]" : out ? "bg-[#98a2b3]" : "bg-[#e0a43d]";

  return (
    <Card className="relative flex flex-wrap items-center gap-x-6 gap-y-3 px-5 py-4">
      <div className="flex items-center gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-2xl bg-brand-soft text-brand">
          <Fingerprint size={20} weight="duotone" />
        </span>
        <div>
          <p className="text-sm font-semibold">{formatWeekday(DEMO_TODAY)}</p>
          <p className="text-[12px] text-muted">{off ? "Weekly off" : `${label} shift`}</p>
        </div>
      </div>
      <div className="flex items-center gap-6 font-mono text-[15px] tabular-nums">
        <span>
          <span className="mr-2 font-sans text-[11px] font-semibold uppercase tracking-wide text-muted">In</span>
          {inn ? formatClock(inn.time) : "—"}
        </span>
        <span>
          <span className="mr-2 font-sans text-[11px] font-semibold uppercase tracking-wide text-muted">Out</span>
          {out ? formatClock(out.time) : "—"}
        </span>
      </div>
      <span className="ml-auto inline-flex items-center gap-2 rounded-full bg-[#f3f5fb] px-3 py-1.5 text-[12px] font-semibold">
        <span className={`relative h-2 w-2 rounded-full ${dot}`}>
          {inside && <span className="absolute inset-0 animate-ping rounded-full bg-[#0f9f6e] opacity-60" />}
        </span>
        {state}
      </span>
      <Link href="/time" className="text-[12px] font-semibold text-brand">
        Attendance
      </Link>
    </Card>
  );
}

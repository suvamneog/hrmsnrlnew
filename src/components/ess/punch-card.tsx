"use client";

import { TactileButton } from "@/components/ui/tactile-button";
import { Card } from "@/components/ui/card";
import { DEMO_TODAY, openPair, punchesOn } from "@/lib/demo";
import { formatClock, formatWeekday } from "@/lib/format";
import { useCurrentUser, useHrms } from "@/lib/store";
import { SignIn, SignOut } from "@phosphor-icons/react";
import { motion } from "motion/react";
import { toast } from "sonner";

export function PunchCard() {
  const me = useCurrentUser();
  const punches = useHrms((s) => s.punches);
  const roster = useHrms((s) => s.roster);
  const shifts = useHrms((s) => s.shifts);
  const clockPunch = useHrms((s) => s.clockPunch);
  if (!me) return null;

  const today = punchesOn(punches, me.id);
  const { inn, out, inside } = openPair(today);
  const closed = Boolean(inn && out && !inside);
  const shift = roster.find((r) => r.employeeId === me.id && r.date === DEMO_TODAY);
  const shiftLabel = shifts.find((s) => s.id === shift?.shiftId)?.label ?? "General";
  const label = closed ? "Day closed" : inside ? "Check out" : "Check in";

  return (
    <Card className="p-5 sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">Attendance</h2>
          <p className="mt-0.5 text-sm text-muted">
            {formatWeekday(DEMO_TODAY)}, {shift?.shiftId === "OFF" ? "Weekly off" : shiftLabel}
          </p>
        </div>
        <span
          className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold ${
            inside ? "bg-ok-soft text-ok" : out ? "bg-fill text-muted" : "bg-warn-soft text-warn"
          }`}
        >
          {inside ? "In plant" : out ? "Checked out" : "Not in yet"}
        </span>
      </div>
      <div className="mt-5 grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-subtle px-4 py-3">
          <p className="text-[11px] font-semibold text-muted">In</p>
          <p className="mt-1 font-mono text-lg font-medium tabular-nums">{inn ? formatClock(inn.time) : "—"}</p>
        </div>
        <div className="rounded-xl bg-subtle px-4 py-3">
          <p className="text-[11px] font-semibold text-muted">Out</p>
          <p className="mt-1 font-mono text-lg font-medium tabular-nums">{out ? formatClock(out.time) : "—"}</p>
        </div>
      </div>
      <div className="mt-5">
        <TactileButton
          className="min-w-[160px]"
          disabled={closed}
          variant={closed ? "secondary" : inside ? "danger" : "mint"}
          onClick={() => {
            const res = clockPunch();
            if (!res.ok) toast.error(res.reason ?? "Could not punch");
            else toast.success(res.kind === "in" ? "Checked in" : "Checked out");
          }}
        >
          <motion.span layout className="inline-flex items-center gap-2">
            {inside ? <SignOut size={18} weight="bold" /> : <SignIn size={18} weight="bold" />}
            {label}
          </motion.span>
        </TactileButton>
      </div>
    </Card>
  );
}

"use client";

import { Button } from "@/components/ui/button";
import { DEMO_TODAY, openPair, punchesOn } from "@/lib/demo";
import { formatClock, formatWeekday } from "@/lib/format";
import { useCurrentUser, useHrms } from "@/lib/store";
import { SignIn, SignOut } from "@phosphor-icons/react";
import { motion, useReducedMotion } from "motion/react";
import { toast } from "sonner";

export function PunchCard() {
  const me = useCurrentUser();
  const punches = useHrms((s) => s.punches);
  const roster = useHrms((s) => s.roster);
  const shifts = useHrms((s) => s.shifts);
  const clockPunch = useHrms((s) => s.clockPunch);
  const reduce = useReducedMotion();
  if (!me) return null;

  const today = punchesOn(punches, me.id);
  const { inn, out, inside } = openPair(today);
  const shift = roster.find((r) => r.employeeId === me.id && r.date === DEMO_TODAY);
  const shiftLabel = shifts.find((s) => s.id === shift?.shiftId)?.label ?? "General";

  return (
    <div className="overflow-hidden rounded-[22px] bg-white p-5 shadow-[0_10px_30px_rgba(45,64,180,0.07)] sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">Attendance</h2>
          <p className="mt-0.5 text-sm text-muted">
            {formatWeekday(DEMO_TODAY)} · {shift?.shiftId === "OFF" ? "Weekly off" : shiftLabel}
          </p>
        </div>
        <span
          className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
            inside ? "bg-[#e7f8ef] text-[#0f9f6e]" : out ? "bg-[#eef1f6] text-muted" : "bg-[#fff4e0] text-[#c47b00]"
          }`}
        >
          {inside ? "In plant" : out ? "Checked out" : "Not in yet"}
        </span>
      </div>
      <div className="mt-5 grid grid-cols-2 gap-3">
        <div className="rounded-2xl bg-[#f6f8fd] px-4 py-3">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">In</p>
          <p className="mt-1 font-mono text-lg font-medium tabular-nums">
            {inn ? formatClock(inn.time) : "—"}
          </p>
        </div>
        <div className="rounded-2xl bg-[#f6f8fd] px-4 py-3">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">Out</p>
          <p className="mt-1 font-mono text-lg font-medium tabular-nums">
            {out ? formatClock(out.time) : "—"}
          </p>
        </div>
      </div>
      <motion.div
        className="mt-5"
        animate={reduce ? undefined : { scale: 1 }}
        whileTap={reduce ? undefined : { scale: 0.98 }}
      >
        <Button
          className="h-12 w-full rounded-2xl text-base"
          onClick={() => {
            const res = clockPunch();
            if (!res.ok) toast.error(res.reason ?? "Could not punch");
            else toast.success(res.kind === "in" ? "Checked in" : "Checked out");
          }}
        >
          {inside ? <SignOut size={18} weight="bold" /> : <SignIn size={18} weight="bold" />}
          {inside ? "Check out" : "Check in"}
        </Button>
      </motion.div>
      <p className="mt-3 text-xs text-muted">
        Staff punch from this screen. Shift crew use the BIO reader at the unit.
      </p>
    </div>
  );
}

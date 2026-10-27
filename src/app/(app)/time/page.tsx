"use client";

import { PunchCard } from "@/components/ess/punch-card";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, Input, Textarea } from "@/components/ui/input";
import { attTone } from "@/lib/status";
import { useCurrentUser, useHrms } from "@/lib/store";
import { shiftFlags } from "@/lib/time-rules";
import { toast } from "sonner";
import { useMemo, useState } from "react";

export default function TimePage() {
  const me = useCurrentUser();
  const attendance = useHrms((s) => s.attendance);
  const punches = useHrms((s) => s.punches);
  const shifts = useHrms((s) => s.shifts);
  const apply = useHrms((s) => s.applyRegularisation);
  const [date, setDate] = useState("2026-10-24");
  const [reason, setReason] = useState("");
  const mine = useMemo(
    () => attendance.filter((a) => a.employeeId === me?.id && a.date.startsWith("2026-10")).slice(-14),
    [attendance, me],
  );
  if (!me) return null;

  return (
    <div>
      <PageHeader title="Attendance" subtitle="Punches from plant biometric readers, matched to the roster. Missing punches stay flagged until regularised." />
      <div className="mb-5 max-w-xl">
        <PunchCard />
      </div>
      <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
        <Card className="overflow-hidden">
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
              {mine.map((a) => {
                const flags = shiftFlags({
                  punches,
                  date: a.date,
                  shift: shifts.find((s) => s.id === a.shiftId),
                });
                return (
                  <tr key={a.date} className="border-t border-line">
                    <td className="px-4 py-2.5">{a.date}</td>
                    <td>{a.shiftId}</td>
                    <td>{flags.hours || a.hours}</td>
                    <td>{flags.overtime || a.overtime || "—"}</td>
                    <td className="text-xs text-muted">
                      {flags.lateMinutes ? `in +${flags.lateMinutes}m` : ""}
                      {flags.earlyMinutes ? ` out −${flags.earlyMinutes}m` : ""}
                      {!flags.lateMinutes && !flags.earlyMinutes ? "—" : ""}
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
        <Card className="p-5">
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
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </Field>
            <Field label="Reason">
              <Textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={3} required />
            </Field>
            <Button type="submit">Submit</Button>
          </form>
          <p className="mt-4 text-xs text-muted">{punches.filter((p) => p.employeeId === me.id).length} punches this month from BIO readers.</p>
        </Card>
      </div>
    </div>
  );
}

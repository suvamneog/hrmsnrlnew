"use client";

import { Field, Grid2, Panel, Pill, Rows } from "@/components/desk/kit";
import { Button } from "@/components/ui/button";
import { Input, Select, Textarea } from "@/components/ui/input";
import { DEMO_TODAY } from "@/lib/demo";
import { useDesk } from "@/lib/desk";
import { formatDay, formatStamp } from "@/lib/format";
import { settingOn } from "@/lib/payroll";
import { useCurrentUser, useHrms } from "@/lib/store";
import type { Employee } from "@/lib/types";
import { useState } from "react";
import { toast } from "sonner";

const SHIFTS = { M: "Morning", A: "Afternoon", N: "Night" } as const;

/* Overtime is asked for and approved before payroll prices it, and each shift-in-charge
   leaves a note for the next one. Both sit on the Shift desk where the changeover happens. */
export function OvertimeAndHandover({ team }: { team: Employee[] }) {
  const me = useCurrentUser();
  const settings = useHrms((s) => s.settings);
  const desk = useDesk();
  const [form, setForm] = useState({ employeeId: "", hours: "2", reason: "" });
  const [note, setNote] = useState("");
  const [shift, setShift] = useState<keyof typeof SHIFTS>(() => {
    const h = new Date().getHours();
    return h < 14 ? "M" : h < 22 ? "A" : "N";
  });
  if (!me) return null;

  const ids = new Set(team.map((e) => e.id));
  const name = (id: string) => team.find((e) => e.id === id)?.name ?? id;
  const rate = settingOn(settings, "ot.hourly", DEMO_TODAY, "workman");
  const mine = desk.overtime.filter((o) => ids.has(o.employeeId));
  const notes = desk.shiftHandovers.filter((h) => h.unitId === me.unitId);

  return (
    <Grid2>
      <Panel title="Overtime" note={`Approve before payroll locks. Workmen are paid ₹${rate} an hour; executives earn no overtime.`}>
        <Rows
          items={mine}
          empty="No overtime asked for."
          render={(o) => (
            <>
              <div className="min-w-0">
                <p className="text-sm font-medium text-ink">
                  {name(o.employeeId)}, {o.hours} h on {formatDay(o.date)}
                </p>
                <p className="truncate text-[12px] text-muted">
                  {o.reason}. ₹{Math.round(o.hours * rate).toLocaleString("en-IN")}
                </p>
              </div>
              {o.status === "pending" ? (
                <div className="flex gap-2">
                  <Button variant="secondary" className="h-8 px-3 text-[13px]" onClick={() => desk.decideOvertime(o.id, "rejected", me.id)}>
                    Reject
                  </Button>
                  <Button className="h-8 px-3 text-[13px]" onClick={() => (desk.decideOvertime(o.id, "approved", me.id), toast.success("Overtime approved for payroll"))}>
                    Approve
                  </Button>
                </div>
              ) : (
                <Pill tone={o.status === "approved" ? "ok" : "muted"}>{o.status === "approved" ? "Approved" : "Rejected"}</Pill>
              )}
            </>
          )}
        />
        <form
          className="mt-4 grid gap-3 border-t border-line pt-4 sm:grid-cols-[minmax(0,1fr)_90px]"
          onSubmit={(e) => {
            e.preventDefault();
            if (!form.employeeId || form.reason.trim().length < 6) return toast.error("Pick a crew member and say why.");
            desk.requestOvertime({ employeeId: form.employeeId, date: DEMO_TODAY, hours: Number(form.hours), reason: form.reason.trim() });
            desk.decideOvertime(useDesk.getState().overtime[0].id, "approved", me.id);
            toast.success("Overtime recorded and approved");
            setForm({ employeeId: "", hours: "2", reason: "" });
          }}
        >
          <Field label="Crew member">
            <Select value={form.employeeId} onChange={(e) => setForm({ ...form, employeeId: e.target.value })}>
              <option value="">Choose</option>
              {team.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Hours">
            <Input type="number" min={0.5} max={6} step={0.5} value={form.hours} onChange={(e) => setForm({ ...form, hours: e.target.value })} />
          </Field>
          <Field label="Reason" className="sm:col-span-2">
            <Input value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} placeholder="Held over for permit job, relief late" />
          </Field>
          <div>
            <Button type="submit">Record overtime</Button>
          </div>
        </form>
      </Panel>

      <Panel title="Shift handover" note="What the next shift-in-charge needs to know before taking over.">
        <Rows
          items={notes}
          empty="No handover notes yet."
          render={(h) => (
            <div className="min-w-0">
              <p className="text-[12px] text-muted">
                {SHIFTS[h.shift]} shift, {formatStamp(h.at)}
              </p>
              <p className="mt-1 text-sm text-ink">{h.note}</p>
            </div>
          )}
        />
        <form
          className="mt-4 grid gap-3 border-t border-line pt-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (note.trim().length < 10) return toast.error("Write what the next shift needs to know.");
            desk.addShiftHandover({ unitId: me.unitId, shift, by: me.id, note: note.trim() });
            setNote("");
            toast.success("Handover saved");
          }}
        >
          <Field label="Shift ending">
            <Select value={shift} onChange={(e) => setShift(e.target.value as keyof typeof SHIFTS)}>
              {Object.entries(SHIFTS).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Note">
            <Textarea rows={3} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Open permits, equipment on standby, crew short, pending jobs" />
          </Field>
          <div>
            <Button type="submit">Save handover</Button>
          </div>
        </form>
      </Panel>
    </Grid2>
  );
}

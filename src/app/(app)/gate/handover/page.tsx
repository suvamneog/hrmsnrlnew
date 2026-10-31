"use client";

import { Field, Grid2, Panel, Rows } from "@/components/desk/kit";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Select, Textarea } from "@/components/ui/input";
import { GATES, useDesk } from "@/lib/desk";
import { formatStamp } from "@/lib/format";
import { useCurrentUser, useHrms } from "@/lib/store";
import { useState } from "react";
import { toast } from "sonner";

/* The gate's own shift handover: what the outgoing guard tells the next one about blocked passes,
   faults and anyone still inside. Its own tab, so a guard changing shift finds it in one tap. */
export default function GateHandoverPage() {
  const me = useCurrentUser();
  const role = useHrms((s) => s.actingRole);
  const employees = useHrms((s) => s.employees);
  const desk = useDesk();
  const [gate, setGate] = useState(GATES[1]);
  const [note, setNote] = useState("");
  if (!me) return null;

  const notes = desk.handovers.filter((h) => h.gate === gate);
  const name = (id: string) => employees.find((e) => e.id === id)?.name ?? id;
  const guard = role === "gate_security";

  return (
    <div className={guard ? "mx-auto max-w-6xl space-y-6 px-4 pb-10" : "space-y-6"}>
      <PageHeader
        title="Gate handover"
        subtitle="What the next shift at this gate needs to know."
        actions={
          <Select value={gate} onChange={(e) => setGate(e.target.value)} className="w-auto">
            {GATES.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </Select>
        }
      />
      <Grid2 className="xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <Panel title="Handover notes" note="Newest first.">
          <Rows
            items={notes}
            empty="No handover notes at this gate."
            render={(h) => (
              <div className="min-w-0">
                <p className="text-[13px] text-muted">
                  {name(h.by)}, {formatStamp(h.at)}
                </p>
                <p className="mt-1 text-sm text-ink">{h.note}</p>
              </div>
            )}
          />
        </Panel>
        <Panel title="Write handover">
          <form
            className="grid gap-4"
            onSubmit={(e) => {
              e.preventDefault();
              if (note.trim().length < 10) return toast.error("Write what the next shift needs to know.");
              const hour = new Date().getHours();
              desk.addHandover({ gate, by: me.id, shift: hour < 14 ? "M" : hour < 22 ? "A" : "N", note: note.trim() });
              setNote("");
              toast.success("Handover saved");
            }}
          >
            <Field label={`Note for ${gate}`}>
              <Textarea rows={5} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Blocked passes, faults, visitors or vehicles still inside" />
            </Field>
            <div>
              <Button type="submit">Save handover</Button>
            </div>
          </form>
        </Panel>
      </Grid2>
    </div>
  );
}

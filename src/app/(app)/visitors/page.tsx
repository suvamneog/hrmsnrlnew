"use client";

import { Field, Grid2, Panel, Pill, Rows, Stats } from "@/components/desk/kit";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Input, Select, Textarea } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GATES, type Vehicle, useDesk } from "@/lib/desk";
import { formatClock, formatStamp } from "@/lib/format";
import { useCurrentUser, useHrms } from "@/lib/store";
import { useState } from "react";
import { toast } from "sonner";

const VISIT_TONE = { expected: "muted", inside: "brand", left: "ok" } as const;
const VISIT_LABEL = { expected: "Expected", inside: "Inside", left: "Left" };

export default function VisitorsPage() {
  const me = useCurrentUser();
  const role = useHrms((s) => s.actingRole);
  const employees = useHrms((s) => s.employees);
  const desk = useDesk();
  const [gate, setGate] = useState("all");
  const [v, setV] = useState({ name: "", org: "", hostId: "", purpose: "", idLast4: "" });
  const [veh, setVeh] = useState({ reg: "", kind: "material" as Vehicle["kind"], material: "", challan: "" });
  const [note, setNote] = useState("");
  if (!me) return null;

  const at = gate === "all" ? GATES[1] : gate;
  const onGate = <T extends { gate: string }>(list: T[]) => (gate === "all" ? list : list.filter((x) => x.gate === gate));
  const visitors = onGate(desk.visitors);
  const vehicles = onGate(desk.vehicles);
  const handovers = onGate(desk.handovers);
  const host = (id: string) => employees.find((e) => e.id === id)?.name ?? id;
  const hosts = employees.filter((e) => !e.id.startsWith("g-")).slice(0, 30);
  const guard = role === "gate_security";

  return (
    <div className={guard ? "mx-auto max-w-6xl space-y-6 px-4 pb-10" : "space-y-6"}>
      <PageHeader
        title="Visitors and vehicles"
        subtitle="Visitor passes, tankers and material, and the handover between gate shifts."
        actions={
          <Select value={gate} onChange={(e) => setGate(e.target.value)} className="h-10 w-auto" aria-label="Gate">
            <option value="all">All gates</option>
            {GATES.map((g) => (
              <option key={g}>{g}</option>
            ))}
          </Select>
        }
      />

      <Stats
        items={GATES.map((g) => ({
          label: g,
          value: desk.visitors.filter((x) => x.gate === g && x.status === "inside").length + desk.vehicles.filter((x) => x.gate === g && x.status === "inside").length,
          hint: "Visitors and vehicles inside",
        })).concat({ label: "Expected today", value: desk.visitors.filter((x) => x.status === "expected").length, hint: "Visitors not yet in" })}
      />

      <Tabs defaultValue="visitors">
        <TabsList>
          <TabsTrigger value="visitors">Visitors</TabsTrigger>
          <TabsTrigger value="vehicles">Vehicles and material</TabsTrigger>
          <TabsTrigger value="handover">Shift handover</TabsTrigger>
        </TabsList>

        <TabsContent value="visitors">
          <Grid2 className="xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
            <Panel title="Visitor passes" note="Check photo ID against the last four digits before letting anyone in.">
              <Rows
                items={visitors}
                empty="No visitors at this gate."
                render={(x) => (
                  <>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-ink">
                        {x.name}, {x.org}
                      </p>
                      <p className="text-[12px] text-muted">
                        Meets {host(x.hostId)} for {x.purpose.toLowerCase()}. ID ending {x.idLast4}
                        {x.inAt ? `. In ${formatClock(x.inAt)}` : ""}
                        {x.outAt ? `, out ${formatClock(x.outAt)}` : ""}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Pill tone={VISIT_TONE[x.status]}>{VISIT_LABEL[x.status]}</Pill>
                      {x.status !== "left" && (
                        <Button variant="secondary" className="h-8 px-3.5 text-[13px]" onClick={() => desk.moveVisitor(x.id)}>
                          {x.status === "expected" ? "Let in" : "Sign out"}
                        </Button>
                      )}
                      {x.status === "inside" && (
                        <Button variant="ghost" className="h-8 px-3 text-[13px]" onClick={() => window.print()}>
                          Print pass
                        </Button>
                      )}
                    </div>
                  </>
                )}
              />
            </Panel>
            <Panel title="New visitor pass">
              <form
                className="grid gap-4"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!v.name || !v.hostId || v.idLast4.length !== 4) return toast.error("Name, host and the last four ID digits are needed.");
                  desk.addVisitor({ ...v, gate: at });
                  toast.success(`Pass ready at ${at}`);
                  setV({ name: "", org: "", hostId: "", purpose: "", idLast4: "" });
                }}
              >
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Visitor name">
                    <Input value={v.name} onChange={(e) => setV({ ...v, name: e.target.value })} />
                  </Field>
                  <Field label="Organisation">
                    <Input value={v.org} onChange={(e) => setV({ ...v, org: e.target.value })} />
                  </Field>
                </div>
                <Field label="Host">
                  <Select value={v.hostId} onChange={(e) => setV({ ...v, hostId: e.target.value })}>
                    <option value="">Who are they meeting</option>
                    {hosts.map((h) => (
                      <option key={h.id} value={h.id}>
                        {h.name}
                      </option>
                    ))}
                  </Select>
                </Field>
                <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_120px]">
                  <Field label="Purpose">
                    <Input value={v.purpose} onChange={(e) => setV({ ...v, purpose: e.target.value })} />
                  </Field>
                  <Field label="ID last 4">
                    <Input inputMode="numeric" maxLength={4} value={v.idLast4} onChange={(e) => setV({ ...v, idLast4: e.target.value.replace(/\D/g, "") })} />
                  </Field>
                </div>
                <div>
                  <Button type="submit">Issue pass</Button>
                </div>
              </form>
            </Panel>
          </Grid2>
        </TabsContent>

        <TabsContent value="vehicles">
          <Grid2 className="xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
            <Panel title="Vehicles inside and out" note="Every vehicle carries a challan or a township permit.">
              <Rows
                items={vehicles}
                empty="No vehicles at this gate."
                render={(x) => (
                  <>
                    <div className="min-w-0">
                      <p className="text-sm font-medium tabular-nums text-ink">{x.reg}</p>
                      <p className="text-[12px] text-muted">
                        {x.material}. Challan {x.challan}. In {formatClock(x.inAt)}
                        {x.outAt ? `, out ${formatClock(x.outAt)}` : ""}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Pill>{x.kind}</Pill>
                      {x.status === "inside" ? (
                        <Button variant="secondary" className="h-8 px-3.5 text-[13px]" onClick={() => desk.exitVehicle(x.id)}>
                          Check out
                        </Button>
                      ) : (
                        <Pill tone="ok">Left</Pill>
                      )}
                    </div>
                  </>
                )}
              />
            </Panel>
            <Panel title="Log a vehicle in">
              <form
                className="grid gap-4"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!veh.reg || !veh.challan) return toast.error("Registration and challan are needed.");
                  desk.addVehicle({ ...veh, gate: at });
                  toast.success(`${veh.reg} logged in at ${at}`);
                  setVeh({ reg: "", kind: "material", material: "", challan: "" });
                }}
              >
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Registration">
                    <Input value={veh.reg} onChange={(e) => setVeh({ ...veh, reg: e.target.value.toUpperCase() })} placeholder="AS 05 C 1234" />
                  </Field>
                  <Field label="Kind">
                    <Select value={veh.kind} onChange={(e) => setVeh({ ...veh, kind: e.target.value as Vehicle["kind"] })}>
                      <option value="material">Material</option>
                      <option value="tanker">Tanker</option>
                      <option value="staff bus">Staff bus</option>
                    </Select>
                  </Field>
                </div>
                <Field label="Material or load">
                  <Input value={veh.material} onChange={(e) => setVeh({ ...veh, material: e.target.value })} />
                </Field>
                <Field label="Challan or permit number">
                  <Input value={veh.challan} onChange={(e) => setVeh({ ...veh, challan: e.target.value })} />
                </Field>
                <div>
                  <Button type="submit">Log in</Button>
                </div>
              </form>
            </Panel>
          </Grid2>
        </TabsContent>

        <TabsContent value="handover">
          <Grid2 className="xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
            <Panel title="Handover notes" note="What the next shift needs to know.">
              <Rows
                items={handovers}
                empty="No handover notes at this gate."
                render={(h) => (
                  <div className="min-w-0">
                    <p className="text-[13px] text-muted">
                      {h.gate}, {host(h.by)}, {formatStamp(h.at)}
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
                  desk.addHandover({ gate: at, by: me.id, shift: hour < 14 ? "M" : hour < 22 ? "A" : "N", note: note.trim() });
                  setNote("");
                  toast.success("Handover saved");
                }}
              >
                <Field label={`Note for ${at}`}>
                  <Textarea rows={5} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Blocked passes, faults, visitors still inside" />
                </Field>
                <div>
                  <Button type="submit">Save handover</Button>
                </div>
              </form>
            </Panel>
          </Grid2>
        </TabsContent>
      </Tabs>
    </div>
  );
}

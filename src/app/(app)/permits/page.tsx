"use client";

import { Field, Grid2, Panel, Pill, Rows, Stats } from "@/components/desk/kit";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Input, Select, Textarea } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DEMO_TODAY } from "@/lib/demo";
import { type Incident, type Permit, useDesk } from "@/lib/desk";
import { downloadText } from "@/lib/files";
import { formatDay, formatStamp } from "@/lib/format";
import { useCurrentUser, useHrms } from "@/lib/store";
import { useState } from "react";
import { toast } from "sonner";

const KIND_COURSE: Record<Permit["kind"], string> = { "hot work": "fire", "cold work": "ind", height: "height", "confined space": "confine" };
const SEV = { 1: { label: "Low", tone: "muted" }, 2: { label: "Medium", tone: "warn" }, 3: { label: "High", tone: "danger" } } as const;

/* Work permits tied to the same certificate check the gate runs, plus incidents and near misses. */
export default function PermitsPage() {
  const me = useCurrentUser();
  const role = useHrms((s) => s.actingRole);
  const workers = useHrms((s) => s.workers);
  const certs = useHrms((s) => s.certificates);
  const courses = useHrms((s) => s.courses);
  const employees = useHrms((s) => s.employees);
  const desk = useDesk();
  const [p, setP] = useState({ kind: "hot work" as Permit["kind"], area: "", crew: "" });
  const [inc, setInc] = useState({ kind: "near miss" as Incident["kind"], area: "", severity: 2 as Incident["severity"], detail: "" });
  const [action, setAction] = useState("");
  if (!me) return null;

  const canIssue = role === "safety_officer" || role === "line_manager";
  const auditor = role === "auditor";
  const wname = (id: string) => workers.find((w) => w.id === id)?.name ?? id;
  const ename = (id: string) => employees.find((e) => e.id === id)?.name ?? id;
  const course = (id: string) => courses.find((c) => c.id === id)?.name ?? id;
  // A worker on a permit without a valid certificate for its course is the same block the gate applies.
  const lapsed = (permit: Permit) =>
    permit.workerIds.filter((w) => !certs.some((c) => c.personId === w && c.courseId === permit.courseId && c.expires >= DEMO_TODAY));
  const active = desk.permits.filter((x) => x.status === "active");
  const atRisk = active.filter((x) => lapsed(x).length > 0);

  function oisdReport() {
    const lines = [
      "OISD-STD-207 style monthly HSE summary (demo export)",
      `Generated ${formatStamp(new Date().toISOString())}`,
      "",
      "kind,area,date,severity,status,action",
      ...desk.incidents.map((i) => `${i.kind},${i.area},${i.at.slice(0, 10)},${SEV[i.severity].label},${i.status},${(i.action ?? "").replace(/,/g, ";")}`),
      "",
      "permit,kind,area,from,to,status,workers_without_valid_certificate",
      ...desk.permits.map((x) => `${x.id},${x.kind},${x.area},${x.from},${x.to},${x.status},${lapsed(x).length}`),
    ];
    downloadText("hse-oisd-summary.csv", lines.join("\n"), "text/csv");
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Permits and incidents"
        subtitle="A permit cannot run with a worker whose certificate has lapsed."
        actions={
          <Button variant="secondary" onClick={oisdReport}>
            Export OISD summary
          </Button>
        }
      />

      <Stats
        items={[
          { label: "Active permits", value: active.length },
          { label: "Permits with lapsed certificates", value: atRisk.length, tone: atRisk.length ? "danger" : "ok" },
          { label: "Open incidents", value: desk.incidents.filter((i) => i.status === "open").length, tone: "warn" },
          { label: "Near misses this month", value: desk.incidents.filter((i) => i.kind === "near miss").length },
        ]}
      />

      <Tabs defaultValue="permits">
        <TabsList>
          <TabsTrigger value="permits">Work permits</TabsTrigger>
          <TabsTrigger value="incidents">Incidents and near misses</TabsTrigger>
        </TabsList>

        <TabsContent value="permits">
          <Grid2 className="xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
            <Panel title="Permits">
              <Rows
                items={desk.permits}
                empty="No permits."
                render={(x) => {
                  const bad = lapsed(x);
                  return (
                    <>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-ink">
                          {x.kind[0].toUpperCase() + x.kind.slice(1)}, {x.area}
                        </p>
                        <p className="text-[12px] text-muted">
                          {formatDay(x.from)} to {formatDay(x.to)}. Needs {course(x.courseId)}. Crew: {x.workerIds.map(wname).join(", ")}
                        </p>
                        {bad.length > 0 && x.status === "active" && (
                          <p className="mt-1 text-[12px] font-medium text-danger">
                            Blocked at gate: {bad.map(wname).join(", ")}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Pill tone={x.status === "active" ? (bad.length ? "danger" : "ok") : x.status === "suspended" ? "warn" : "muted"}>
                          {x.status === "active" ? (bad.length ? "At risk" : "Active") : x.status === "suspended" ? "Suspended" : "Closed"}
                        </Pill>
                        {canIssue && x.status === "active" && (
                          <Button variant="secondary" className="h-8 px-3.5 text-[13px]" onClick={() => desk.setPermit(x.id, bad.length ? "suspended" : "closed")}>
                            {bad.length ? "Suspend" : "Close"}
                          </Button>
                        )}
                      </div>
                    </>
                  );
                }}
              />
            </Panel>
            {canIssue && (
              <Panel title="Issue a permit" note="Crew is checked against the course the permit needs.">
                <form
                  className="grid gap-4"
                  onSubmit={(e) => {
                    e.preventDefault();
                    const ids = p.crew.split(",").map((s) => s.trim()).filter(Boolean);
                    const found = ids.map((q) => workers.find((w) => w.id === q || w.name.toLowerCase() === q.toLowerCase())?.id).filter(Boolean) as string[];
                    if (!p.area || !found.length) return toast.error("Area and at least one known worker are needed.");
                    const permit = { kind: p.kind, area: p.area, issuerId: me.id, workerIds: found, courseId: KIND_COURSE[p.kind], from: DEMO_TODAY, to: DEMO_TODAY };
                    const bad = lapsed({ ...permit, id: "", status: "active" });
                    if (bad.length) return toast.error(`${bad.map(wname).join(", ")} lacks a valid ${course(permit.courseId)} certificate.`);
                    desk.addPermit(permit);
                    toast.success("Permit issued for today");
                    setP({ ...p, area: "", crew: "" });
                  }}
                >
                  <Field label="Kind">
                    <Select value={p.kind} onChange={(e) => setP({ ...p, kind: e.target.value as Permit["kind"] })}>
                      {Object.keys(KIND_COURSE).map((k) => (
                        <option key={k} value={k}>
                          {k[0].toUpperCase() + k.slice(1)}
                        </option>
                      ))}
                    </Select>
                  </Field>
                  <Field label="Area">
                    <Input value={p.area} onChange={(e) => setP({ ...p, area: e.target.value })} placeholder="CDU heater H-101" />
                  </Field>
                  <Field label="Crew (names or worker IDs, comma separated)">
                    <Input value={p.crew} onChange={(e) => setP({ ...p, crew: e.target.value })} placeholder="w-1, Nurul Islam" />
                  </Field>
                  <div>
                    <Button type="submit">Issue permit</Button>
                  </div>
                </form>
              </Panel>
            )}
          </Grid2>
        </TabsContent>

        <TabsContent value="incidents">
          <Grid2 className="xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
            <Panel title="Reported">
              <Rows
                items={desk.incidents}
                empty="Nothing reported."
                render={(i) => (
                  <div className="w-full">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-ink">
                          {i.kind[0].toUpperCase() + i.kind.slice(1)}, {i.area}
                        </p>
                        <p className="text-[12px] text-muted">
                          {ename(i.reportedBy)}, {formatStamp(i.at)}
                        </p>
                      </div>
                      <span className="flex gap-1.5">
                        <Pill tone={SEV[i.severity].tone}>{SEV[i.severity].label}</Pill>
                        <Pill tone={i.status === "open" ? "warn" : "ok"}>{i.status === "open" ? "Open" : "Closed"}</Pill>
                      </span>
                    </div>
                    <p className="mt-2 text-[13px] text-ink/80">{i.detail}</p>
                    {i.action && <p className="mt-1 text-[13px] text-muted">Action: {i.action}</p>}
                    {role === "safety_officer" && i.status === "open" && (
                      <form
                        className="mt-3 flex flex-wrap gap-2"
                        onSubmit={(e) => {
                          e.preventDefault();
                          if (!action.trim()) return toast.error("Record the corrective action.");
                          desk.closeIncident(i.id, action.trim());
                          setAction("");
                        }}
                      >
                        <Input className="h-9 min-w-0 flex-1" placeholder="Corrective action taken" value={action} onChange={(e) => setAction(e.target.value)} />
                        <Button type="submit" className="h-9">
                          Close
                        </Button>
                      </form>
                    )}
                  </div>
                )}
              />
            </Panel>
            {!auditor && (
              <Panel title="Report" note="Anyone in the plant can report. Safety closes with an action.">
                <form
                  className="grid gap-4"
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!inc.area || inc.detail.trim().length < 8) return toast.error("Area and what happened are needed.");
                    desk.reportIncident({ ...inc, reportedBy: me.id });
                    toast.success("Reported to Safety");
                    setInc({ ...inc, area: "", detail: "" });
                  }}
                >
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Kind">
                      <Select value={inc.kind} onChange={(e) => setInc({ ...inc, kind: e.target.value as Incident["kind"] })}>
                        <option value="near miss">Near miss</option>
                        <option value="unsafe act">Unsafe act</option>
                        <option value="incident">Incident</option>
                      </Select>
                    </Field>
                    <Field label="Severity">
                      <Select value={inc.severity} onChange={(e) => setInc({ ...inc, severity: Number(e.target.value) as Incident["severity"] })}>
                        <option value={1}>Low</option>
                        <option value={2}>Medium</option>
                        <option value={3}>High</option>
                      </Select>
                    </Field>
                  </div>
                  <Field label="Area">
                    <Input value={inc.area} onChange={(e) => setInc({ ...inc, area: e.target.value })} />
                  </Field>
                  <Field label="What happened">
                    <Textarea rows={4} value={inc.detail} onChange={(e) => setInc({ ...inc, detail: e.target.value })} />
                  </Field>
                  <div>
                    <Button type="submit">Report</Button>
                  </div>
                </form>
              </Panel>
            )}
          </Grid2>
        </TabsContent>
      </Tabs>
    </div>
  );
}

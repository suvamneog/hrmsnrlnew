"use client";

import { TownshipCharts } from "@/components/charts/page-charts";

import { Fact, Ring } from "@/components/home/viz";
import { PageHeader } from "@/components/layout/page-header";
import { InView } from "@/components/motion/in-view";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { HeroCard } from "@/components/ui/hero-card";
import { Field, Input, Select } from "@/components/ui/input";
import { cn } from "@/lib/cn";
import { DEMO_TODAY } from "@/lib/demo";
import { formatDay, formatStamp, inr } from "@/lib/format";
import { settingOn } from "@/lib/payroll";
import { useCurrentUser, useHrms } from "@/lib/store";
import type { Quarter } from "@/lib/types";
import { HouseLine, Wrench } from "@phosphor-icons/react";
import { AnimatedBackground } from "@/components/motion-primitives/animated-background";
import { spring } from "@/lib/motion";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";

const TYPES: Quarter["type"][] = ["V", "IV", "III", "II"];
const STATUS_TONE = { occupied: "#3d5afe", vacant: "#0f9f6e", maintenance: "#e0a43d" } as const;
const CATEGORIES = ["Plumbing", "Electrical", "Civil", "Carpentry", "Appliance"];
const STEPS = ["open", "in_progress", "closed"] as const;

// Township entitlement follows grade: senior executives get the larger quarter types.
function eligibleType(grade: string, cadre: string): Quarter["type"] {
  if (cadre === "workman") return "II";
  if (["E6", "E7", "E8", "E9"].includes(grade)) return "V";
  if (["E3", "E4", "E5"].includes(grade)) return "IV";
  return "III";
}

export default function TownshipPage() {
  const quarters = useHrms((s) => s.quarters);
  const employees = useHrms((s) => s.employees);
  const maint = useHrms((s) => s.maintenance);
  const waiting = useHrms((s) => s.waiting);
  const settings = useHrms((s) => s.settings);
  const role = useHrms((s) => s.actingRole);
  const me = useCurrentUser();
  const allotQuarter = useHrms((s) => s.allotQuarter);
  const addWaiting = useHrms((s) => s.addWaiting);
  const raiseMaintenance = useHrms((s) => s.raiseMaintenance);
  const tickMaintenance = useHrms((s) => s.tickMaintenance);
  const vacateQuarter = useHrms((s) => s.vacateQuarter);
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [issue, setIssue] = useState("");
  const [filter, setFilter] = useState<Quarter["type"] | "all">("all");
  if (!me) return null;

  const hr = role === "hr_admin";
  const occupied = quarters.filter((q) => q.status === "occupied").length;
  const myQuarter = quarters.find((q) => q.employeeId === me.id);
  const myType = eligibleType(me.grade, me.cadre);
  const queue = waiting.filter((w) => w.type === myType).sort((a, b) => a.applied.localeCompare(b.applied));
  const myPlace = queue.findIndex((w) => w.employeeId === me.id);
  const hraPct = settingOn(settings, "hra.z", DEMO_TODAY, me.cadre, 10);
  const hra = Math.round((me.basic * hraPct) / 100);
  const fee = myQuarter?.licenceFee ?? quarters.find((q) => q.type === myType)?.licenceFee ?? 0;
  const myTickets = maint.filter((m) => m.quarterId === myQuarter?.id);
  const tickets = hr ? maint : myTickets;
  const shown = quarters.filter((q) => filter === "all" || q.type === filter);
  const nameOf = (id?: string) => employees.find((e) => e.id === id)?.name;

  return (
    <div className="space-y-5">
      <PageHeader title="Township housing" subtitle="Numaligarh township · quarters, waiting list and upkeep" />

      <TownshipCharts />

      <InView>
        <HeroCard eyebrow="Housing stock" title={`${occupied} of ${quarters.length} quarters occupied`}>
          <div className="grid gap-8 md:grid-cols-[auto_1fr]">
            <Ring value={occupied} max={quarters.length}>
              <div>
                <p className="text-[28px] font-semibold tabular-nums tracking-tight">{Math.round((occupied / quarters.length) * 100)}%</p>
                <p className="text-[11px] text-muted">occupancy</p>
              </div>
            </Ring>
            <div className="space-y-4">
              {TYPES.map((t, i) => {
                const rows = quarters.filter((q) => q.type === t);
                return (
                  <div key={t}>
                    <div className="mb-1.5 flex items-baseline justify-between text-[13px]">
                      <span className="font-medium">Type {t}</span>
                      <span className="tabular-nums text-muted">
                        {rows.filter((q) => q.status === "vacant").length} vacant · {waiting.filter((w) => w.type === t).length} waiting
                      </span>
                    </div>
                    <div className="flex h-2.5 gap-0.5 overflow-hidden rounded-full bg-[#eef1f8]">
                      {(["occupied", "maintenance", "vacant"] as const).map((st) => {
                        const n = rows.filter((q) => q.status === st).length;
                        if (!n) return null;
                        return (
                          <motion.div
                            key={st}
                            className="h-full"
                            style={{ background: STATUS_TONE[st] }}
                            initial={{ width: 0 }}
                            whileInView={{ width: `${(n / rows.length) * 100}%` }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1], delay: 0.06 * i }}
                          />
                        );
                      })}
                    </div>
                  </div>
                );
              })}
              <div className="flex gap-4 pt-1 text-[11px] text-muted">
                {(Object.keys(STATUS_TONE) as (keyof typeof STATUS_TONE)[]).map((k) => (
                  <span key={k} className="inline-flex items-center gap-1.5 capitalize">
                    <span className="h-2 w-2 rounded-full" style={{ background: STATUS_TONE[k] }} />
                    {k}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </HeroCard>
      </InView>

      <div className="grid gap-5 *:min-w-0 lg:grid-cols-2">
        <InView delay={0.05}>
          <Card className="h-full p-6">
            <div className="flex items-center gap-3">
              <span className="grid h-11 w-11 place-items-center rounded-2xl bg-brand-soft text-brand">
                <HouseLine size={22} weight="duotone" />
              </span>
              <div>
                <h2 className="text-lg font-semibold tracking-tight">Your housing</h2>
                <p className="text-[12px] text-muted">
                  {me.grade} is entitled to Type {myType}
                </p>
              </div>
            </div>
            <div className="mt-5">
              {myQuarter ? (
                <>
                  <Fact label="Quarter" value={myQuarter.number} />
                  <Fact label="Licence fee, from pay" value={`${inr(myQuarter.licenceFee)} / month`} />
                  <Fact label="HRA" value="Stopped while you hold a quarter" />
                </>
              ) : (
                <>
                  <Fact label="Status" value={myPlace >= 0 ? `#${myPlace + 1} of ${queue.length} for Type ${myType}` : "Not on the list"} tone={myPlace >= 0 ? "warn" : undefined} />
                  <Fact label={`HRA now (${hraPct}% of basic)`} value={`${inr(hra)} / month`} />
                  <Fact label="Licence fee once allotted" value={`${inr(fee)} / month`} />
                </>
              )}
            </div>
            <div className="mt-5 flex flex-wrap gap-2">
              {!myQuarter && myPlace < 0 && me.cadre !== "contract" && (
                <Button
                  onClick={() => {
                    addWaiting(me.id, myType);
                    toast.success(`Added to the Type ${myType} waiting list`);
                  }}
                >
                  Join Type {myType} waiting list
                </Button>
              )}
              {myQuarter && (
                <Button
                  variant="secondary"
                  onClick={() => {
                    const r = vacateQuarter(myQuarter.id);
                    if (!r.ok) toast.error(r.reason);
                    else toast.success("Vacation recorded. HRA restarts next payroll.");
                  }}
                >
                  Vacate quarter
                </Button>
              )}
            </div>
          </Card>
        </InView>

        <InView delay={0.1}>
          <Card className="h-full p-6">
            <h2 className="text-lg font-semibold tracking-tight">Waiting list</h2>
            <p className="text-[12px] text-muted">By type, then by date applied.</p>
            <ol className="mt-4 space-y-2">
              {[...waiting]
                .sort((a, b) => a.type.localeCompare(b.type) || a.applied.localeCompare(b.applied))
                .map((w) => {
                  const mineRow = w.employeeId === me.id;
                  const place = waiting.filter((x) => x.type === w.type && x.applied <= w.applied).length;
                  const vacant = quarters.find((q) => q.type === w.type && q.status === "vacant");
                  return (
                    <li
                      key={w.id}
                      className={cn("flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm", mineRow ? "bg-brand-soft" : "bg-[#f6f8fd]")}
                    >
                      <span className="grid h-7 w-7 place-items-center rounded-full bg-white text-[12px] font-semibold tabular-nums">{place}</span>
                      <span className="flex-1 truncate">
                        {hr || mineRow ? nameOf(w.employeeId) : "Employee"}
                        <span className="ml-2 text-[12px] text-muted">since {formatDay(w.applied)}</span>
                      </span>
                      <Badge tone="lilac">Type {w.type}</Badge>
                      {hr && vacant && place === 1 && (
                        <button
                          className="text-[12px] font-semibold text-brand"
                          onClick={() => {
                            const r = allotQuarter(vacant.id, w.employeeId);
                            if (!r.ok) toast.error(r.reason);
                            else toast.success(`Allotted ${vacant.number}. HRA stops.`);
                          }}
                        >
                          Allot {vacant.number}
                        </button>
                      )}
                    </li>
                  );
                })}
            </ol>
          </Card>
        </InView>
      </div>

      <InView delay={0.05}>
        <Card className="p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-semibold tracking-tight">Quarters</h2>
            <div className="flex gap-1 rounded-full bg-[#f3f5fb] p-1">
              <AnimatedBackground
                defaultValue={filter}
                onValueChange={(v) => v && setFilter(v as Quarter["type"] | "all")}
                className="rounded-full bg-white shadow-[0_2px_8px_rgba(27,33,64,0.08)]"
                transition={spring}
              >
                {(["all", ...TYPES] as const).map((t) => (
                  <button
                    key={t}
                    data-id={t}
                    type="button"
                    className="rounded-full px-3 py-1 text-[12px] font-semibold text-muted transition-colors data-[checked=true]:text-ink"
                  >
                    {t === "all" ? "All" : `Type ${t}`}
                  </button>
                ))}
              </AnimatedBackground>
            </div>
          </div>
          <div className="mt-4 grid gap-2 sm:grid-cols-3 lg:grid-cols-5">
            {shown.map((q) => (
              <div key={q.id} className={cn("rounded-2xl border p-3", q.employeeId === me.id ? "border-brand bg-brand-soft" : "border-line")}>
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold">{q.number}</p>
                  <span className="h-2 w-2 rounded-full" style={{ background: STATUS_TONE[q.status] }} />
                </div>
                <p className="mt-1 truncate text-[12px] text-muted">
                  {q.status === "occupied" ? (hr ? (nameOf(q.employeeId) ?? "Allotted") : q.employeeId === me.id ? "You" : "Allotted") : q.status === "vacant" ? "Vacant" : "Under repair"}
                </p>
                <p className="mt-1 text-[11px] tabular-nums text-muted">{inr(q.licenceFee)} / mo</p>
              </div>
            ))}
          </div>
        </Card>
      </InView>

      <InView delay={0.05}>
        <Card className="p-6">
          <div className="flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-[#fff1e6] text-[#e07a3d]">
              <Wrench size={22} weight="duotone" />
            </span>
            <div>
              <h2 className="text-lg font-semibold tracking-tight">Maintenance</h2>
              <p className="text-[12px] text-muted">{hr ? "All township requests" : myQuarter ? `Requests for ${myQuarter.number}` : "For residents of a quarter"}</p>
            </div>
          </div>

          {myQuarter && (
            <form
              className="mt-5 grid gap-3 sm:grid-cols-[180px_1fr_auto] sm:items-end"
              onSubmit={(e) => {
                e.preventDefault();
                raiseMaintenance(myQuarter.id, `${category}: ${issue}`);
                setIssue("");
                toast.success("Request raised with township maintenance");
              }}
            >
              <Field label="Category">
                <Select value={category} onChange={(e) => setCategory(e.target.value)}>
                  {CATEGORIES.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </Select>
              </Field>
              <Field label="What needs fixing">
                <Input value={issue} onChange={(e) => setIssue(e.target.value)} placeholder="Bathroom tap leaking" required />
              </Field>
              <Button type="submit">Raise request</Button>
            </form>
          )}

          <ul className="mt-5 space-y-3">
            {tickets.length === 0 && <p className="py-4 text-center text-sm text-muted">No requests.</p>}
            {tickets.map((m) => {
              const at = STEPS.indexOf(m.status);
              return (
                <li key={m.id} className="rounded-2xl border border-line p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold">{m.title}</p>
                      <p className="text-[12px] text-muted">
                        {quarters.find((q) => q.id === m.quarterId)?.number} · raised {formatStamp(m.raisedAt)}
                      </p>
                    </div>
                    {hr && m.status !== "closed" && (
                      <Button variant="secondary" onClick={() => tickMaintenance(m.id)}>
                        {m.status === "open" ? "Start work" : "Close"}
                      </Button>
                    )}
                  </div>
                  <div className="mt-3 flex items-center gap-2">
                    {STEPS.map((st, i) => (
                      <div key={st} className="flex flex-1 items-center gap-2">
                        <span className={cn("h-1.5 flex-1 rounded-full", i <= at ? "bg-brand" : "bg-[#eef1f8]")} />
                        <span className={cn("text-[11px] capitalize", i <= at ? "font-semibold text-ink" : "text-muted")}>
                          {st.replace("_", " ")}
                        </span>
                      </div>
                    ))}
                  </div>
                </li>
              );
            })}
          </ul>
        </Card>
      </InView>
    </div>
  );
}

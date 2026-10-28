"use client";

import { Bars, Columns, Fact, Ring, StageTrack } from "@/components/home/viz";
import { PageHeader } from "@/components/layout/page-header";
import { InView } from "@/components/motion/in-view";
import { HeroCard } from "@/components/ui/hero-card";
import { differenceInCalendarDays, parseISO } from "date-fns";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, Select } from "@/components/ui/input";
import { formatDay, inr } from "@/lib/format";
import { DEMO_TODAY } from "@/lib/demo";
import { useCurrentUser, useHrms } from "@/lib/store";
import { useMemo, useState } from "react";
import { toast } from "sonner";

const RATINGS = [
  { value: 5, label: "5 · Outstanding" },
  { value: 4, label: "4 · Very good" },
  { value: 3, label: "3 · Good" },
  { value: 2, label: "2 · Fair" },
  { value: 1, label: "1 · Poor" },
];

const STAGE: Record<string, string> = {
  goal_setting: "Goal setting",
  mid_year: "Mid-year review",
  self: "Self-appraisal",
  reporting: "Reporting officer",
  reviewing: "Reviewing officer",
  normalisation: "Normalisation",
  closed: "Closed",
};

export default function PerformancePage() {
  const me = useCurrentUser();
  const goalsAll = useHrms((s) => s.goals);
  const appraisals = useHrms((s) => s.appraisals);
  const employees = useHrms((s) => s.employees);
  const role = useHrms((s) => s.actingRole);
  const acceptGoals = useHrms((s) => s.acceptGoals);
  const rateAppraisal = useHrms((s) => s.rateAppraisal);
  const closeAppraisal = useHrms((s) => s.closeAppraisal);
  const [selfScore, setSelfScore] = useState("4");
  const [reportScore, setReportScore] = useState<Record<string, string>>({});
  const [reviewScore, setReviewScore] = useState<Record<string, string>>({});
  const meId = me?.id;
  const team = useMemo(() => employees.filter((e) => e.managerId === meId), [employees, meId]);
  if (!me) return null;

  const mine = appraisals.find((a) => a.employeeId === me.id);
  const myGoals = goalsAll.filter((g) => g.employeeId === me.id);
  const reportQueue = appraisals.filter((a) => a.stage === "reporting" && team.some((e) => e.id === a.employeeId));
  const reviewQueue =
    role === "hr_admin" ? appraisals.filter((a) => a.stage === "reviewing" && a.employeeId !== me.id) : [];

  const myId = me.id;
  const score = myGoals.reduce((n, g) => n + (g.weight * g.achievement) / 100, 0);
  const years = (iso: string) => Math.max(0, differenceInCalendarDays(parseISO(DEMO_TODAY), parseISO(iso)) / 365.25).toFixed(1);
  const service = years(me.doj);
  const inGrade = years(me.assignmentHistory.find((a) => a.grade === me.grade && !a.validTo)?.validFrom ?? me.doj);
  function submitSelf() {
    const r = rateAppraisal(myId, "selfRating", Number(selfScore));
    if (!r.ok) toast.error(r.reason);
    else toast.success("Self-appraisal sent to reporting officer.");
  }

  return (
    <div>
      <PageHeader
        title="Appraisal 2026-27"
        subtitle="Key result areas, self rating, reporting and reviewing officer, as per the NRL PMS cycle."
      />
      <div className="space-y-5">
        <InView>
          <HeroCard
            eyebrow={`APAR cycle ${mine?.cycle ?? "2026-27"}`}
            title={mine ? `You are at ${STAGE[mine.stage].toLowerCase()}` : "No appraisal issued"}
            action={
              mine?.finalRating ? (
                <span className="rounded-full bg-[#e7f8ef] px-3 py-1.5 text-[12px] font-semibold text-[#0f9f6e]">
                  Final {mine.finalRating} · PRP {inr(mine.prpAmount ?? 0)}
                </span>
              ) : undefined
            }
          >
            <StageTrack stages={Object.entries(STAGE).map(([id, label]) => ({ id, label }))} current={mine?.stage ?? "goal_setting"} />
            <div className="mt-7 grid gap-8 md:grid-cols-[auto_1fr]">
              <div className="flex items-center gap-6">
                <Ring value={score} max={100}>
                  <div>
                    <p className="text-[28px] font-semibold tabular-nums tracking-tight">{score.toFixed(0)}</p>
                    <p className="text-[11px] text-muted">weighted %</p>
                  </div>
                </Ring>
                <div className="min-w-[170px]">
                  <Fact label="Self" value={mine?.selfRating ?? "—"} />
                  <Fact label="Reporting officer" value={mine?.reportingRating ?? "—"} />
                  <Fact label="Reviewing officer" value={mine?.reviewingRating ?? "—"} />
                </div>
              </div>
              <div>
                {mine && (mine.stage === "goal_setting" || mine.stage === "mid_year") && (
                  <div className="rounded-2xl bg-[#f6f8fd] p-4">
                    <p className="text-sm font-semibold">{mine.stage === "mid_year" ? "Mid-year review is open" : "Your KRAs are ready"}</p>
                    <p className="mt-1 text-[12px] text-muted">
                      {mine.stage === "mid_year" ? "Close the review to open self-appraisal." : "Accept the goals your reporting officer set."}
                    </p>
                    <Button
                      className="mt-3"
                      onClick={() => {
                        const r = acceptGoals(me.id);
                        if (!r.ok) toast.error(r.reason);
                        else toast.success("Goals accepted. Self-appraisal is open.");
                      }}
                    >
                      {mine.stage === "mid_year" ? "Close mid-year" : "Accept goals"}
                    </Button>
                  </div>
                )}
                {mine?.stage === "self" && (
                  <div className="rounded-2xl bg-[#f6f8fd] p-4">
                    <p className="text-sm font-semibold">Rate your year</p>
                    <div className="mt-3 flex gap-2">
                      {RATINGS.slice().reverse().map((x) => (
                        <button
                          key={x.value}
                          onClick={() => setSelfScore(String(x.value))}
                          className={`flex-1 rounded-xl px-2 py-2.5 text-center transition ${
                            selfScore === String(x.value) ? "bg-brand text-white" : "bg-white hover:bg-brand-soft"
                          }`}
                        >
                          <p className="text-lg font-semibold">{x.value}</p>
                          <p className="text-[10px] opacity-80">{x.label.split("· ")[1]}</p>
                        </button>
                      ))}
                    </div>
                    <Button className="mt-3" onClick={submitSelf}>
                      Submit self-appraisal
                    </Button>
                  </div>
                )}
                {mine && !["goal_setting", "mid_year", "self"].includes(mine.stage) && (
                  <p className="text-sm text-muted">
                    {mine.stage === "closed" ? "This cycle is closed. Your rating feeds performance-related pay." : "Your appraisal is with your reporting chain."}
                  </p>
                )}
              </div>
            </div>
          </HeroCard>
        </InView>

        <div className="grid gap-5 *:min-w-0 lg:grid-cols-[1.4fr_1fr]">
          <InView delay={0.05}>
            <Card className="p-6">
              <div className="mb-4 flex items-baseline justify-between">
                <h2 className="text-lg font-semibold tracking-tight">Key result areas</h2>
                <span className="text-[12px] text-muted">{myGoals.reduce((n, g) => n + g.weight, 0)}% weight</span>
              </div>
              {myGoals.length === 0 && <p className="py-6 text-center text-sm text-muted">No KRAs issued this cycle.</p>}
              <div className="space-y-5">
                {myGoals.map((g) => (
                  <div key={g.id}>
                    <div className="flex items-baseline justify-between gap-3">
                      <p className="text-sm font-semibold">{g.title}</p>
                      <span className="rounded-full bg-[#f3f5fb] px-2 py-0.5 text-[11px] font-semibold text-muted">{g.weight}%</span>
                    </div>
                    <p className="mt-0.5 text-[12px] text-muted">Target {g.target}</p>
                    <Bars rows={[{ label: "Achieved at mid-year", value: g.achievement }]} format={(n) => `${n}%`} max={100} />
                  </div>
                ))}
              </div>
            </Card>
          </InView>
          <InView delay={0.1}>
            <Card className="p-6">
              <h2 className="text-lg font-semibold tracking-tight">Promotion inputs</h2>
              <p className="mt-0.5 text-[12px] text-muted">What the DPC sees from this record.</p>
              <div className="mt-4">
                <Fact label="Service with NRL" value={`${service} yrs`} />
                <Fact label={`In grade ${me.grade}`} value={`${inGrade} yrs`} />
                <Fact label="Ratings this cycle" value={mine?.finalRating ?? "Pending"} />
                <Fact label="Vigilance clearance" value="Clear" tone="ok" />
              </div>
              <div className="mt-5 rounded-2xl bg-[#f6f8fd] p-4 text-[12px] leading-relaxed text-muted">
                Final ratings set performance-related pay, capped at 100% of basic. There is no forced share of below-par ratings
                (dropped in DPE&apos;s 2017 method).
              </div>
            </Card>
          </InView>
        </div>

        {(role === "hr_admin" || role === "auditor") && (
          <InView delay={0.05}>
            <Card className="p-6">
              <h2 className="text-lg font-semibold tracking-tight">Cycle progress, plant-wide</h2>
              <div className="mt-4 grid gap-8 md:grid-cols-2">
                <Bars rows={Object.entries(STAGE).map(([id, label]) => ({ label, value: appraisals.filter((a) => a.stage === id).length }))} />
                <div>
                  <p className="mb-1 text-[12px] font-semibold text-muted">Final ratings so far</p>
                  <Columns data={[1, 2, 3, 4, 5].map((n) => ({ label: String(n), value: appraisals.filter((a) => a.finalRating === n).length }))} height={90} />
                </div>
              </div>
            </Card>
          </InView>
        )}
      </div>

      <div className="mt-6">
      {role === "line_manager" && (
        <div className="mb-6">
          <h2 className="mb-3 font-semibold">Reporting officer</h2>
          {reportQueue.length === 0 && <p className="text-sm text-muted">No self-appraisals waiting.</p>}
          <div className="grid gap-3">
            {reportQueue.map((a) => {
              const e = employees.find((x) => x.id === a.employeeId);
              return (
                <Card key={a.employeeId} className="p-4">
                  <p className="font-semibold">{e?.name}</p>
                  <p className="text-sm text-muted">Self {a.selfRating ?? "—"}</p>
                  <div className="mt-3 flex max-w-sm flex-col gap-3">
                    <Field label="Reporting officer rating">
                      <Select
                        value={reportScore[a.employeeId] ?? "4"}
                        onChange={(ev) => setReportScore((s) => ({ ...s, [a.employeeId]: ev.target.value }))}
                      >
                        {RATINGS.map((x) => (
                          <option key={x.value} value={x.value}>
                            {x.label}
                          </option>
                        ))}
                      </Select>
                    </Field>
                    <Button
                      onClick={() => {
                        const r = rateAppraisal(a.employeeId, "reportingRating", Number(reportScore[a.employeeId] ?? 4));
                        if (!r.ok) toast.error(r.reason);
                        else toast.success(`Rated ${e?.preferredName}. Sent to reviewing officer.`);
                      }}
                    >
                      Submit reporting officer rating
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {role === "hr_admin" && (
        <div>
          <h2 className="mb-3 font-semibold">Reviewing officer</h2>
          {reviewQueue.length === 0 && <p className="text-sm text-muted">Nothing in reviewing.</p>}
          <div className="grid gap-3">
            {reviewQueue.map((a) => {
              const e = employees.find((x) => x.id === a.employeeId);
              return (
                <Card key={a.employeeId} className="p-4">
                  <p className="font-semibold">{e?.name}</p>
                  <p className="text-sm text-muted">
                    Self {a.selfRating ?? "—"} · Reporting {a.reportingRating ?? "—"}
                  </p>
                  <div className="mt-3 flex max-w-sm flex-col gap-3">
                    <Field label="Reviewing officer rating">
                      <Select
                        value={reviewScore[a.employeeId] ?? "4"}
                        onChange={(ev) => setReviewScore((s) => ({ ...s, [a.employeeId]: ev.target.value }))}
                      >
                        {RATINGS.map((x) => (
                          <option key={x.value} value={x.value}>
                            {x.label}
                          </option>
                        ))}
                      </Select>
                    </Field>
                    <Button
                      variant="secondary"
                      onClick={() => {
                        const r = rateAppraisal(a.employeeId, "reviewingRating", Number(reviewScore[a.employeeId] ?? 4));
                        if (!r.ok) toast.error(r.reason);
                        else toast.success(`Reviewing rating recorded for ${e?.preferredName}.`);
                      }}
                    >
                      Record reviewing rating
                    </Button>
                    <Button
                      onClick={() => {
                        const r = closeAppraisal(a.employeeId);
                        if (!r.ok) toast.error(r.reason);
                        else toast.success(`Closed ${e?.preferredName}. PRP computed.`);
                      }}
                    >
                      Close APAR · {formatDay(DEMO_TODAY)}
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}
      </div>
    </div>
  );
}

"use client";

import { PageHeader } from "@/components/layout/page-header";
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
  function submitSelf() {
    const r = rateAppraisal(myId, "selfRating", Number(selfScore));
    if (!r.ok) toast.error(r.reason);
    else toast.success("Self-appraisal sent to reporting officer.");
  }

  return (
    <div>
      <PageHeader
        title="Appraisal 2026-27"
      />
      <Card className="mb-4 p-5">
        <p className="text-sm text-muted">Your stage</p>
        <p className="text-xl font-semibold">{mine ? STAGE[mine.stage] : "Not issued"}</p>
        {mine?.selfRating && <p className="mt-2 text-sm">Self {mine.selfRating}</p>}
        {mine?.reportingRating && <p className="text-sm">Reporting officer {mine.reportingRating}</p>}
        {mine?.finalRating && (
          <p className="mt-1 text-sm">
            Final {mine.finalRating} · PRP {inr(mine.prpAmount ?? 0)}
          </p>
        )}
        {mine && (mine.stage === "goal_setting" || mine.stage === "mid_year") && (
          <Button
            className="mt-4"
            variant="secondary"
            onClick={() => {
              const r = acceptGoals(me.id);
              if (!r.ok) toast.error(r.reason);
              else toast.success("Goals accepted. Self-appraisal is open.");
            }}
          >
            {mine.stage === "mid_year" ? "Close mid-year and open self-appraisal" : "Accept goals"}
          </Button>
        )}
        {mine?.stage === "self" && (
          <div className="mt-4 flex max-w-sm flex-col gap-3">
            <Field label="Self rating">
              <Select value={selfScore} onChange={(e) => setSelfScore(e.target.value)}>
                {RATINGS.map((x) => (
                  <option key={x.value} value={x.value}>
                    {x.label}
                  </option>
                ))}
              </Select>
            </Field>
            <Button onClick={submitSelf}>Submit self-appraisal</Button>
          </div>
        )}
      </Card>

      <h2 className="mb-3 font-semibold">KRAs</h2>
      <div className="mb-6 grid gap-3">
        {myGoals.length === 0 && <p className="text-sm text-muted">No KRAs issued this cycle.</p>}
        {myGoals.map((g) => (
          <Card key={g.id} className="p-4">
            <div className="flex justify-between gap-3">
              <p className="font-semibold">{g.title}</p>
              <span className="text-sm text-muted">{g.weight}%</span>
            </div>
            <p className="text-sm text-muted">Target {g.target}</p>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-brand-soft">
              <div className="h-full bg-brand" style={{ width: `${g.achievement}%` }} />
            </div>
            <p className="mt-1 text-xs text-muted">{g.achievement}% at mid-year</p>
          </Card>
        ))}
      </div>

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
  );
}

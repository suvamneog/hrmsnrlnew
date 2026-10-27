"use client";

import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { inr } from "@/lib/format";
import { useCurrentUser, useHrms } from "@/lib/store";
import { toast } from "sonner";

export default function PerformancePage() {
  const me = useCurrentUser();
  const goalsAll = useHrms((s) => s.goals);
  const appraisals = useHrms((s) => s.appraisals);
  const employees = useHrms((s) => s.employees);
  const role = useHrms((s) => s.actingRole);
  const rateAppraisal = useHrms((s) => s.rateAppraisal);
  const closeAppraisal = useHrms((s) => s.closeAppraisal);
  if (!me) return null;
  const mine = appraisals.find((a) => a.employeeId === me.id);
  const team = appraisals.filter((a) => employees.find((e) => e.id === a.employeeId)?.managerId === me.id);
  const goals = goalsAll.filter((g) => g.employeeId === me.id || (role === "line_manager" && employees.find((e) => e.id === g.employeeId)?.managerId === me.id));

  return (
    <div>
      <PageHeader title="Appraisal 2026-27" subtitle="Ratings feed performance related pay. DPE dropped the forced 10% below-par quota in 2017." />
      <Card className="mb-4 p-4">
        <p className="text-sm text-muted">Current stage</p>
        <p className="text-xl font-semibold capitalize">{mine?.stage.replaceAll("_", " ")}</p>
        {mine?.finalRating && (
          <p className="mt-2 text-sm">Final {mine.finalRating} · PRP {inr(mine.prpAmount ?? 0)}</p>
        )}
        <div className="mt-3 flex flex-wrap gap-2">
          <Button variant="secondary" onClick={() => rateAppraisal(me.id, "selfRating", 4)}>
            Submit self-appraisal
          </Button>
          {role === "line_manager" && team.map((a) => (
            <Button key={a.employeeId} variant="secondary" onClick={() => rateAppraisal(a.employeeId, "reportingRating", 4)}>
              Reporting officer · {employees.find((e) => e.id === a.employeeId)?.preferredName}
            </Button>
          ))}
          {role === "hr_admin" && mine && (
            <Button
              onClick={() => {
                rateAppraisal(me.id, "reviewingRating", 4);
                closeAppraisal(me.id);
                toast.success("Closed. PRP computed from rating × MoU score.");
              }}
            >
              Reviewing officer close
            </Button>
          )}
        </div>
      </Card>
      <div className="grid gap-3">
        {goals.map((g) => (
          <Card key={g.id} className="p-4">
            <div className="flex justify-between gap-3">
              <p className="font-semibold">{g.title}</p>
              <span className="text-sm text-muted">{g.weight}%</span>
            </div>
            <p className="text-sm text-muted">Target {g.target}</p>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-brand-soft">
              <div className="h-full bg-brand" style={{ width: `${g.achievement}%` }} />
            </div>
            <p className="mt-1 text-xs text-muted">{g.achievement}% achieved at mid-year</p>
          </Card>
        ))}
      </div>
    </div>
  );
}

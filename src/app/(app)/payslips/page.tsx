"use client";

import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { downloadPdf, form16Text, payslipText } from "@/lib/files";
import { inr, monthLabel } from "@/lib/format";
import { useCurrentUser, useHrms } from "@/lib/store";
import { DocumentList } from "@/components/ui/document-list";

export default function PayslipsPage() {
  const me = useCurrentUser();
  const runs = useHrms((s) => s.payrollRuns);
  if (!me) return null;

  const current = runs[0];
  const slips = runs
    .filter((r) => r.stage === "publish")
    .map((r) => ({ run: r, row: r.results.find((x) => x.employeeId === me.id) }))
    .filter((x) => x.row);

  return (
    <div>
      <PageHeader title="Payslips"
        subtitle="Monthly slips and Form 16 from the NRL payroll, Numaligarh." />
      {current.stage !== "publish" && (
        <Card className="p-6 text-sm text-muted">
          {monthLabel(current.month)} payroll is in {current.stage.replaceAll("_", " ")}.
        </Card>
      )}
      {slips.length > 0 && (
        <div className="mt-4">
          <DocumentList
            title="FY 2026-27"
            items={[
              ...slips.map(({ run, row }) => ({
                id: run.id,
                title: monthLabel(run.month),
                subtitle: `Net ${inr(row!.net)}`,
                onOpen: () => downloadPdf(`payslip-${me.empNo}-${run.month}.pdf`, payslipText(me, row!).split("\n")),
                openLabel: "Download PDF",
                viewHref: `/payroll/${me.id}?month=${run.month}`,
              })),
              {
                id: "form16",
                title: "Form 16",
                subtitle: "Part B, AY 2027-28",
                onOpen: () => downloadPdf(`form16-${me.empNo}.pdf`, form16Text(me, slips[0].row!).split("\n")),
                openLabel: "Download PDF",
              },
            ]}
          />
        </div>
      )}
    </div>
  );
}

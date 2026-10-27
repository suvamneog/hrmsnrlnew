"use client";

import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { downloadPdf, form16Text, payslipText } from "@/lib/files";
import { inr } from "@/lib/format";
import { useCurrentUser, useHrms } from "@/lib/store";
import Link from "next/link";

export default function PayslipsPage() {
  const me = useCurrentUser();
  const run = useHrms((s) => s.payrollRuns[0]);
  const row = run.results.find((r) => r.employeeId === me?.id);
  if (!me) return null;

  return (
    <div>
      <PageHeader title="Payslips" />
      {run.stage !== "publish" && !row && (
        <Card className="p-6 text-sm text-muted">
          October payroll is still in {run.stage.replaceAll("_", " ")}.
        </Card>
      )}
      <div className="mt-4 grid gap-3">
        {row && (
          <Card className="flex flex-wrap items-center justify-between gap-3 p-4">
            <div>
              <p className="font-semibold">October 2026</p>
              <p className="text-sm text-muted">
                {run.stage === "publish" ? "Published" : `In ${run.stage.replaceAll("_", " ")}`} · {inr(row.net)}
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="secondary" onClick={() => downloadPdf(`payslip-${me.empNo}-2026-10.pdf`, payslipText(me, row).split("\n"))}>
                Download PDF
              </Button>
              <Button variant="secondary" onClick={() => downloadPdf(`form16-${me.empNo}.pdf`, form16Text(me, row).split("\n"))}>
                Form 16
              </Button>
              <Link href={`/payroll/${me.id}`}>
                <Button>Open slip</Button>
              </Link>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}

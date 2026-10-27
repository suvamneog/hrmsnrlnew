"use client";

import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { FileDownload, FileDownloadList } from "@/components/ui/file-download";
import { downloadPdf, form16Text, payslipText, prettySize } from "@/lib/files";
import { inr, monthLabel } from "@/lib/format";
import { useCurrentUser, useHrms } from "@/lib/store";
import Link from "next/link";

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
      <PageHeader title="Payslips" />
      {current.stage !== "publish" && (
        <Card className="p-6 text-sm text-muted">
          {monthLabel(current.month)} payroll is in {current.stage.replaceAll("_", " ")}.
        </Card>
      )}
      <div className="mt-4 grid gap-3">
        {slips.map(({ run, row }) => (
          <Card key={run.id} className="p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-semibold">{monthLabel(run.month)}</p>
                <p className="text-sm text-muted">Published · {inr(row!.net)}</p>
              </div>
              <Link href={`/payroll/${me.id}?month=${run.month}`} className="text-sm font-semibold text-brand">
                Open slip
              </Link>
            </div>
            <FileDownloadList className="mt-2">
              <FileDownload
                kind="pdf"
                name="Payslip"
                size={prettySize(payslipText(me, row!))}
                onClick={() => downloadPdf(`payslip-${me.empNo}-${run.month}.pdf`, payslipText(me, row!).split("\n"))}
              />
              <FileDownload
                kind="pdf"
                name="Form 16"
                size={prettySize(form16Text(me, row!))}
                onClick={() => downloadPdf(`form16-${me.empNo}.pdf`, form16Text(me, row!).split("\n"))}
              />
            </FileDownloadList>
          </Card>
        ))}
      </div>
    </div>
  );
}

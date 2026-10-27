"use client";

import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { FileDownload, FileDownloadList } from "@/components/ui/file-download";
import { downloadPdf, form16Text, payslipText, prettySize } from "@/lib/files";
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
          <Card className="p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-semibold">October 2026</p>
                <p className="text-sm text-muted">
                  {run.stage === "publish" ? "Published" : `In ${run.stage.replaceAll("_", " ")}`} · {inr(row.net)}
                </p>
              </div>
              <Link href={`/payroll/${me.id}`} className="text-sm font-semibold text-brand">
                Open slip
              </Link>
            </div>
            <FileDownloadList className="mt-2">
              <FileDownload
                kind="pdf"
                name="Payslip"
                size={prettySize(payslipText(me, row))}
                onClick={() => downloadPdf(`payslip-${me.empNo}-2026-10.pdf`, payslipText(me, row).split("\n"))}
              />
              <FileDownload
                kind="pdf"
                name="Form 16"
                size={prettySize(form16Text(me, row))}
                onClick={() => downloadPdf(`form16-${me.empNo}.pdf`, form16Text(me, row).split("\n"))}
              />
            </FileDownloadList>
          </Card>
        )}
      </div>
    </div>
  );
}

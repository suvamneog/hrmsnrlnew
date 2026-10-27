"use client";

import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { FileDownload, FileDownloadList } from "@/components/ui/file-download";
import { downloadPdf, form16Text, payslipText, prettySize } from "@/lib/files";
import { inr, monthLabel } from "@/lib/format";
import { useCurrentUser, useHrms } from "@/lib/store";
import Link from "next/link";
import { InView } from "@/components/motion/in-view";
import { AnimatedFolder } from "@/components/ui/3d-folder";
import { FilePreview, PayslipPreview } from "@/components/ui/doc-preview";

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
      {slips.length > 0 && (
        <InView className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <AnimatedFolder
            title="FY 2026-27"
            countLabel="documents"
            items={[
              ...slips.map(({ run, row }) => ({
                id: run.id,
                title: monthLabel(run.month),
                subtitle: `Net ${inr(row!.net)}`,
                preview: <PayslipPreview employee={me} row={row!} label={monthLabel(run.month)} />,
                onOpen: () => downloadPdf(`payslip-${me.empNo}-${run.month}.pdf`, payslipText(me, row!).split("\n")),
                openLabel: "Download PDF",
              })),
              {
                id: "form16",
                title: "Form 16",
                subtitle: "Part B · AY 2027-28",
                preview: <FilePreview name={`form16-${me.empNo}.pdf`} content={form16Text(me, slips[0].row!)} kind="pdf" />,
                onOpen: () => downloadPdf(`form16-${me.empNo}.pdf`, form16Text(me, slips[0].row!).split("\n")),
                openLabel: "Download PDF",
              },
            ]}
          />
        </InView>
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

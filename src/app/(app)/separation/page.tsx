"use client";

import { SeparationCharts } from "@/components/charts/page-charts";

import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { FileDownload, FileDownloadList } from "@/components/ui/file-download";
import { downloadText, prettySize } from "@/lib/files";
import { formatDay, formatStamp, inr } from "@/lib/format";
import { useHrms } from "@/lib/store";
import { ExpandableCard } from "@/components/ui/expandable-card";
import { DEMO_TODAY } from "@/lib/demo";
import { SignOut } from "@phosphor-icons/react";
import { differenceInCalendarDays, parseISO } from "date-fns";
import { toast } from "sonner";

export default function SeparationPage() {
  const rows = useHrms((s) => s.separations);
  const employees = useHrms((s) => s.employees);
  const tickClearance = useHrms((s) => s.tickClearance);
  const settleFf = useHrms((s) => s.settleFf);
  const role = useHrms((s) => s.actingRole);
  const meId = useHrms((s) => s.currentUserId);

  return (
    <div>
      <PageHeader title="Separation" subtitle="Clearance across departments, then gratuity, leave encashment and final settlement" />
      <SeparationCharts />
      {rows.map((s) => {
        const e = employees.find((x) => x.id === s.employeeId);
        const open = s.clearances.some((c) => !c.done);
        return (
          <div key={s.id} className="mb-4 max-w-xl">
            <ExpandableCard
              defaultOpen={open}
              icon={<SignOut size={20} weight="duotone" />}
              title={e?.name ?? s.employeeId}
              subtitle={`${s.kind === "superannuation" ? "Superannuation" : s.kind === "vrs" ? "Voluntary retirement" : s.kind === "death" ? "Death in service" : "Resignation"}, last day ${formatDay(s.lastDay)}`}
              items={s.clearances.map((c) => ({
                label: c.dept,
                done: c.done,
                hint: c.done ? [c.byId ? employees.find((x) => x.id === c.byId)?.preferredName : null, c.at ? formatStamp(c.at) : null].filter(Boolean).join(", ") : undefined,
                onToggle:
                  role === "hr_admin" && s.employeeId !== meId && !c.done
                    ? () => {
                        tickClearance(s.id, c.dept);
                        toast.success(`${c.dept} clearance recorded.`);
                      }
                    : undefined,
              }))}
              priority={{
                label: differenceInCalendarDays(parseISO(s.lastDay), parseISO(DEMO_TODAY)) <= 30 ? "Due this month" : "Planned",
                tone: differenceInCalendarDays(parseISO(s.lastDay), parseISO(DEMO_TODAY)) <= 30 ? "danger" : "muted",
              }}
              status={{
                label: s.status === "settled" ? "Settled" : open ? "Clearance" : "Ready for F&F",
                tone: s.status === "settled" ? "ok" : open ? "warn" : "brand",
              }}
              people={[e?.name, ...s.clearances.filter((c) => c.byId).map((c) => employees.find((x) => x.id === c.byId)?.name)].filter((n, i, all): n is string => !!n && all.indexOf(n) === i)}
              footer={
                <div>
            {s.netFf !== undefined && (
              <div className="mt-4 grid gap-2 text-sm sm:grid-cols-4">
                <p>Gratuity {inr(s.gratuity ?? 0)}</p>
                <p>EL encashment {inr(s.leaveEncashment ?? 0)}</p>
                <p>Recoveries {inr(s.recoveries ?? 0)}</p>
                <p className="font-semibold">Net F&F {inr(s.netFf)}</p>
              </div>
            )}
            {(role === "hr_admin" || role === "payroll_officer") && s.employeeId !== meId && (
            <div className="mt-4 flex items-center gap-3">
              <Button
                disabled={open || s.status === "settled"}
                onClick={() => {
                  settleFf(s.id);
                  toast.success("F&F settled");
                }}
              >
                Compute F&F
              </Button>
              {open && <span className="text-sm text-muted">Record every clearance first.</span>}
            </div>
            )}
            {s.netFf !== undefined && (
              <FileDownloadList className="mt-1">
                <FileDownload
                  kind="xls"
                  name="F&F bank file"
                  size={prettySize(
                    `${e?.name}\nGratuity ${s.gratuity}\nEL ${s.leaveEncashment}\nRecoveries ${s.recoveries}\nNet ${s.netFf}`,
                  )}
                  onClick={() =>
                    downloadText(
                      `FF-${e?.empNo}.csv`,
                      `${e?.name}\nGratuity ${s.gratuity}\nEL ${s.leaveEncashment}\nRecoveries ${s.recoveries}\nNet ${s.netFf}`,
                    )
                  }
                />
              </FileDownloadList>
            )}
                </div>
              }
            />
          </div>
        );
      })}
    </div>
  );
}

"use client";

import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FileDownload, FileDownloadList } from "@/components/ui/file-download";
import { downloadText, prettySize } from "@/lib/files";
import { formatStamp, inr } from "@/lib/format";
import { useHrms } from "@/lib/store";
import { toast } from "sonner";

export default function SeparationPage() {
  const rows = useHrms((s) => s.separations);
  const employees = useHrms((s) => s.employees);
  const tickClearance = useHrms((s) => s.tickClearance);
  const settleFf = useHrms((s) => s.settleFf);

  return (
    <div>
      <PageHeader title="Separation" />
      {rows.map((s) => {
        const e = employees.find((x) => x.id === s.employeeId);
        const open = s.clearances.some((c) => !c.done);
        return (
          <Card key={s.id} className="mb-4 p-5">
            <div className="flex justify-between">
              <div>
                <p className="font-semibold">{e?.name}</p>
                <p className="text-sm text-muted">
                  {s.kind} · last day {s.lastDay}
                </p>
              </div>
              <Badge tone={s.status === "settled" ? "ok" : "warn"}>{s.status}</Badge>
            </div>
            <ul className="mt-4 grid gap-2 sm:grid-cols-2">
              {s.clearances.map((c) => {
                const who = c.byId ? employees.find((x) => x.id === c.byId)?.preferredName : null;
                return (
                  <li key={c.dept} className="rounded-xl bg-[#f6f8fd] px-3 py-2 text-sm">
                    <div className="flex items-center justify-between gap-2">
                      <span>{c.dept}</span>
                      {c.done ? (
                        <span className="text-[#0f9f6e]">Cleared</span>
                      ) : (
                        <Button
                          variant="secondary"
                          onClick={() => {
                            tickClearance(s.id, c.dept);
                            toast.success(`${c.dept} clearance recorded.`);
                          }}
                        >
                          Record clearance
                        </Button>
                      )}
                    </div>
                    {c.done && (who || c.at) && (
                      <p className="mt-1 text-xs text-muted">
                        {who ?? "Recorded"}
                        {c.at ? ` · ${formatStamp(c.at)}` : ""}
                      </p>
                    )}
                  </li>
                );
              })}
            </ul>
            {s.netFf !== undefined && (
              <div className="mt-4 grid gap-2 text-sm sm:grid-cols-4">
                <p>Gratuity {inr(s.gratuity ?? 0)}</p>
                <p>EL encashment {inr(s.leaveEncashment ?? 0)}</p>
                <p>Recoveries {inr(s.recoveries ?? 0)}</p>
                <p className="font-semibold">Net F&F {inr(s.netFf)}</p>
              </div>
            )}
            <div className="mt-4 flex gap-2">
              <Button
                disabled={open || s.status === "settled"}
                onClick={() => {
                  settleFf(s.id);
                  toast.success("F&F settled");
                }}
              >
                Compute F&F
              </Button>
            </div>
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
          </Card>
        );
      })}
    </div>
  );
}

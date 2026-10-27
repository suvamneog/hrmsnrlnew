"use client";

import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { downloadText } from "@/lib/files";
import { formatStamp } from "@/lib/format";
import { NRL_INTERFACES } from "@/lib/interfaces";
import { nrlExtractCsv, sapMismatch } from "@/lib/sap";
import { useHrms } from "@/lib/store";
import type { NrlInterfaceStatus } from "@/lib/types";
import { useRef } from "react";
import { toast } from "sonner";

const STATUS: Record<NrlInterfaceStatus, { label: string; tone: "ok" | "warn" | "muted" | "brand" }> = {
  acked: { label: "Acknowledged", tone: "ok" },
  file_ready: { label: "File ready", tone: "brand" },
  awaiting_ack: { label: "Awaiting ack", tone: "warn" },
  idle: { label: "Idle", tone: "muted" },
};

export default function InterfacesPage() {
  const interfaces = useHrms((s) => s.interfaces);
  const employees = useHrms((s) => s.employees);
  const sapHr = useHrms((s) => s.sapHr);
  const role = useHrms((s) => s.actingRole);
  const acceptSap = useHrms((s) => s.acceptSap);
  const acceptSapAll = useHrms((s) => s.acceptSapAll);
  const importSapCsv = useHrms((s) => s.importSapCsv);
  const recordInterface = useHrms((s) => s.recordInterface);
  const fileRef = useRef<HTMLInputElement>(null);
  const mismatches = sapMismatch(employees, sapHr);
  const canHr = role === "hr_admin" || role === "payroll_officer";

  return (
    <div>
      <PageHeader
        title="Interfaces"
      />
      <div className="grid gap-3">
        {interfaces.map((row) => {
          const cat = NRL_INTERFACES.find((x) => x.id === row.id) ?? row;
          const st = STATUS[row.status];
          return (
            <Card key={row.id} className="p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-semibold">{cat.name}</h2>
                    <Badge tone={st.tone}>{st.label}</Badge>
                  </div>
                  <p className="mt-1 text-sm text-muted">{cat.system}</p>
                </div>
              </div>
              <p className="mt-3 text-sm">{cat.purpose}</p>
              <p className="mt-1 text-xs text-muted">{cat.channel}</p>
              <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-3">
                <div>
                  <dt className="text-[11px] font-semibold uppercase tracking-wide text-muted">Last file</dt>
                  <dd className="mt-1 font-medium">{row.lastFile ?? "—"}</dd>
                </div>
                <div>
                  <dt className="text-[11px] font-semibold uppercase tracking-wide text-muted">Last ack</dt>
                  <dd className="mt-1 font-medium">{row.lastAck ?? "—"}</dd>
                </div>
                <div>
                  <dt className="text-[11px] font-semibold uppercase tracking-wide text-muted">Last run</dt>
                  <dd className="mt-1 font-medium">{row.lastRun ? formatStamp(row.lastRun) : "—"}</dd>
                </div>
              </dl>

              {row.id === "sap_hr" && canHr && (
                <div className="mt-4 border-t border-line pt-4">
                  <p className="mb-2 text-sm font-semibold">SAP HR reconciliation</p>
                  <p className="mb-3 text-xs text-muted">CSV columns EMPNO, NAME, GRADE, BASIC, UNIT. Import replaces matching employee numbers.</p>
                  <div className="mb-3 flex flex-wrap gap-2">
                    <Button
                      variant="secondary"
                      onClick={() => {
                        downloadText("NRL_HR_EXTRACT.csv", nrlExtractCsv(employees), "text/csv");
                        recordInterface("sap_hr", {
                          lastFile: "NRL_HR_EXTRACT.csv",
                          lastRun: new Date().toISOString(),
                          status: "file_ready",
                        });
                        toast.success("NRL extract written");
                      }}
                    >
                      NRL extract
                    </Button>
                    <Button variant="secondary" onClick={() => fileRef.current?.click()}>
                      Import SAP CSV
                    </Button>
                    {mismatches.length > 0 && (
                      <Button
                        onClick={() => {
                          const n = acceptSapAll();
                          toast.success(`Accepted SAP values for ${n}`);
                        }}
                      >
                        Accept all
                      </Button>
                    )}
                  </div>
                  <input
                    ref={fileRef}
                    type="file"
                    accept=".csv,text/csv"
                    className="hidden"
                    onChange={(ev) => {
                      const file = ev.target.files?.[0];
                      ev.target.value = "";
                      if (!file) return;
                      file.text().then((text) => {
                        const r = importSapCsv(text);
                        if (!r.ok) toast.error(r.reason);
                        else toast.success(`Imported ${r.imported} · ${r.mismatches} differences`);
                      });
                    }}
                  />
                  {mismatches.length === 0 && <p className="text-sm text-muted">No differences against the last SAP file.</p>}
                  {mismatches.slice(0, 12).map((m) => (
                    <div key={m.s.empNo} className="flex items-center justify-between py-1 text-sm">
                      <span>
                        {m.s.name} · {m.issue}
                      </span>
                      {m.e && (
                        <button
                          className="text-xs font-semibold text-brand"
                          onClick={() => {
                            acceptSap(m.s.empNo);
                            toast.success("Accepted SAP values");
                          }}
                        >
                          Accept SAP
                        </button>
                      )}
                    </div>
                  ))}
                  {mismatches.length > 12 && (
                    <p className="mt-2 text-xs text-muted">{mismatches.length - 12} more · Accept all to apply</p>
                  )}
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}

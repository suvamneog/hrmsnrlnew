"use client";

import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FileDownload, FileDownloadList } from "@/components/ui/file-download";
import { downloadText, prettySize } from "@/lib/files";
import { formatStamp } from "@/lib/format";
import { NRL_INTERFACES } from "@/lib/interfaces";
import { nrlExtractCsv, sapMismatch } from "@/lib/sap";
import { useHrms } from "@/lib/store";
import type { NrlInterfaceGroup, NrlInterfaceStatus } from "@/lib/types";
import { ConnectorLogo } from "@/components/ui/connector-logo";
import { InView } from "@/components/motion/in-view";
import { useRef } from "react";
import { toast } from "sonner";

const STATUS: Record<NrlInterfaceStatus, { label: string; tone: "ok" | "warn" | "muted" | "brand" }> = {
  acked: { label: "Acknowledged", tone: "ok" },
  file_ready: { label: "File ready", tone: "brand" },
  awaiting_ack: { label: "Awaiting ack", tone: "warn" },
  idle: { label: "Idle", tone: "muted" },
  online: { label: "Online", tone: "ok" },
  queued: { label: "Offline, queued", tone: "warn" },
  phase0: { label: "Phase 0, to confirm", tone: "muted" },
};

const GROUPS: { id: NrlInterfaceGroup; title: string; note: string }[] = [
  { id: "record", title: "Systems of record", note: "Master data and internal platforms, exchanged with reconciliation." },
  { id: "field", title: "Hardware and field", note: "Plant devices at the gates. Works offline, syncs when the network returns." },
  { id: "statutory", title: "File-based statutory", note: "Files go out, an acknowledgement comes back. Not live APIs." },
  { id: "identity", title: "Identity and notification", note: "Sign-in, roles and outbound alerts on NRL's own infrastructure." },
];

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
      <PageHeader title="Interfaces" subtitle={`${interfaces.length} connectors, every exchange logged, retried and reconciled`} />
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {GROUPS.map((g) => {
          const rows = interfaces.filter((x) => (NRL_INTERFACES.find((c) => c.id === x.id)?.group ?? "record") === g.id);
          return (
            <Card key={g.id} className="p-4">
              <p className="text-[12px] font-medium text-muted">{g.title}</p>
              <p className="mt-1 text-2xl font-semibold tabular-nums tracking-tight">{rows.length}</p>
              <div className="mt-3 flex -space-x-2">
                {rows.map((x) => (
                  <ConnectorLogo key={x.id} id={x.id} size={28} />
                ))}
              </div>
            </Card>
          );
        })}
      </div>
      {GROUPS.map((g) => (
      <section key={g.id} className="mb-8">
        <div className="mb-3">
          <h2 className="text-lg font-semibold tracking-tight">{g.title}</h2>
          <p className="text-[13px] text-muted">{g.note}</p>
        </div>
      <div className="grid gap-3">
        {interfaces.filter((x) => (NRL_INTERFACES.find((c) => c.id === x.id)?.group ?? "record") === g.id).map((row) => {
          const cat = NRL_INTERFACES.find((x) => x.id === row.id) ?? row;
          const st = STATUS[row.status];
          return (
            <InView key={row.id}>
            <Card className="p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                <ConnectorLogo id={row.id} />
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-semibold">{cat.name}</h2>
                    <Badge tone={st.tone}>{st.label}</Badge>
                  </div>
                  <p className="mt-1 text-sm text-muted">{cat.system}</p>
                </div>
                </div>
              </div>
              <p className="mt-3 text-sm">{cat.purpose}</p>
              <p className="mt-1 text-xs text-muted">{cat.channel}</p>
              <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-3">
                <div>
                  <dt className="text-[12px] font-semibold text-muted">Last file</dt>
                  <dd className="mt-1 font-medium">{row.lastFile ?? "—"}</dd>
                </div>
                <div>
                  <dt className="text-[12px] font-semibold text-muted">Last ack</dt>
                  <dd className="mt-1 font-medium">{row.lastAck ?? "—"}</dd>
                </div>
                <div>
                  <dt className="text-[12px] font-semibold text-muted">Last run</dt>
                  <dd className="mt-1 font-medium">{row.lastRun ? formatStamp(row.lastRun) : "—"}</dd>
                </div>
              </dl>

              {row.id === "sap_hr" && canHr && (
                <div className="mt-4 border-t border-line pt-4">
                  <p className="mb-2 text-sm font-semibold">SAP S/4HANA reconciliation</p>
                  <p className="mb-3 text-xs text-muted">CSV columns EMPNO, NAME, GRADE, BASIC, UNIT. Import replaces matching employee numbers.</p>
                  <FileDownloadList className="mb-3">
                    <FileDownload
                      kind="xls"
                      name="NRL HR extract"
                      size={prettySize(nrlExtractCsv(employees))}
                      onClick={() => {
                        downloadText("NRL_HR_EXTRACT.csv", nrlExtractCsv(employees), "text/csv");
                        recordInterface("sap_hr", {
                          lastFile: "NRL_HR_EXTRACT.csv",
                          lastRun: new Date().toISOString(),
                          status: "file_ready",
                        });
                        toast.success("NRL extract written");
                      }}
                    />
                  </FileDownloadList>
                  <div className="mb-3 flex flex-wrap gap-2">
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
                        else toast.success(`Imported ${r.imported}, ${r.mismatches} differences`);
                      });
                    }}
                  />
                  {mismatches.length === 0 && <p className="text-sm text-muted">No differences against the last SAP file.</p>}
                  {mismatches.slice(0, 12).map((m) => (
                    <div key={m.s.empNo} className="flex items-center justify-between py-1 text-sm">
                      <span>
                        {m.s.name}, {m.issue}
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
                    <p className="mt-2 text-xs text-muted">{mismatches.length - 12} more, Accept all to apply</p>
                  )}
                </div>
              )}
            </Card>
            </InView>
          );
        })}
      </div>
      </section>
      ))}
    </div>
  );
}

"use client";

import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DatePicker } from "@/components/ui/date-picker";
import { Input } from "@/components/ui/input";
import { formatDay } from "@/lib/format";
import { SETTINGS } from "@/lib/seed";
import { useCurrentUser, useHrms } from "@/lib/store";
import type { PolicySetting, PolicyVersion } from "@/lib/types";
import { toast } from "sonner";
import { useState } from "react";

function historyOf(s: PolicySetting): PolicyVersion[] {
  return s.versions ?? SETTINGS.find((x) => x.id === s.id)?.versions ?? [];
}

export default function PolicyPage() {
  const me = useCurrentUser();
  const settings = useHrms((s) => s.settings);
  const employees = useHrms((s) => s.employees);
  const role = useHrms((s) => s.actingRole);
  const propose = useHrms((s) => s.proposeSetting);
  const approve = useHrms((s) => s.approveSetting);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [from, setFrom] = useState<Record<string, string>>({});
  const who = (id?: string) => employees.find((e) => e.id === id)?.preferredName ?? id ?? "—";

  return (
    <div>
      <PageHeader
        title="Rules engine"
      />
      <div className="grid gap-3">
        {settings.map((s) => {
          const past = historyOf(s);
          return (
            <Card key={s.id} className="p-4">
              <div className="grid gap-3 md:grid-cols-[1.4fr_120px_1fr]">
                <div>
                  <p className="font-semibold">{s.label}</p>
                  <p className="text-xs text-muted">
                    {s.key} · {s.cadre ?? "all"} · from {formatDay(s.validFrom)} · {s.source}
                    {s.approvedBy ? ` · approved ${who(s.approvedBy)}` : ""}
                  </p>
                  {s.pendingValue !== undefined && (
                    <Badge tone="warn" className="mt-2">
                      Pending {String(s.pendingValue)}
                      {s.pendingBy ? ` · ${who(s.pendingBy)}` : ""}
                    </Badge>
                  )}
                </div>
                <p className="text-xl font-semibold">
                  {s.value}
                  <span className="ml-1 text-xs font-medium text-muted">{s.unit}</span>
                </p>
                <div className="flex flex-wrap items-center gap-2">
                  <Input
                    className="h-10 w-24"
                    value={drafts[s.id] ?? String(s.value)}
                    onChange={(e) => setDrafts((d) => ({ ...d, [s.id]: e.target.value }))}
                    disabled={role === "auditor"}
                  />
                  <DatePicker
                    className="h-10 w-44"
                    value={from[s.id] ?? s.validFrom}
                    onChange={(iso) => setFrom((d) => ({ ...d, [s.id]: iso }))}
                    disabled={role === "auditor"}
                  />
                  {role === "hr_admin" && (
                    <Button
                      variant="secondary"
                      onClick={() => {
                        propose(s.id, Number(drafts[s.id] ?? s.value), from[s.id] ?? s.validFrom);
                        toast("Sent for checker");
                      }}
                    >
                      Propose
                    </Button>
                  )}
                  {(role === "finance_approver" || role === "payroll_officer") && s.pendingBy && s.pendingBy !== me?.id && (
                    <Button
                      onClick={() => {
                        const r = approve(s.id);
                        if (!r.ok) toast.error(r.reason);
                        else toast.success("Setting live. Backdated change will pay arrears on next compute.");
                      }}
                    >
                      Approve
                    </Button>
                  )}
                </div>
              </div>
              {past.length > 0 && (
                <div className="mt-4 overflow-x-auto border-t border-line pt-3">
                  <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted">Earlier versions</p>
                  <table className="w-full text-xs">
                    <thead className="text-left text-muted">
                      <tr>
                        <th className="py-1 pr-3 font-medium">From</th>
                        <th className="py-1 pr-3 font-medium">To</th>
                        <th className="py-1 pr-3 font-medium">Value</th>
                        <th className="py-1 pr-3 font-medium">Proposed</th>
                        <th className="py-1 pr-3 font-medium">Approved</th>
                        <th className="py-1 font-medium">Source</th>
                      </tr>
                    </thead>
                    <tbody>
                      {past.map((v, i) => (
                        <tr key={`${s.id}-${v.validFrom}-${i}`} className="text-ink">
                          <td className="py-1 pr-3 tabular-nums">{formatDay(v.validFrom)}</td>
                          <td className="py-1 pr-3 tabular-nums">{v.validTo ? formatDay(v.validTo) : "—"}</td>
                          <td className="py-1 pr-3 tabular-nums">
                            {v.value}
                            {s.unit ? ` ${s.unit}` : ""}
                          </td>
                          <td className="py-1 pr-3">{who(v.proposedBy)}</td>
                          <td className="py-1 pr-3">{who(v.approvedBy)}</td>
                          <td className="py-1 text-muted">{v.source}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}

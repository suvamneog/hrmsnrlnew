"use client";

import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useCurrentUser, useHrms } from "@/lib/store";
import { toast } from "sonner";
import { useState } from "react";

export default function PolicyPage() {
  const me = useCurrentUser();
  const settings = useHrms((s) => s.settings);
  const role = useHrms((s) => s.actingRole);
  const propose = useHrms((s) => s.proposeSetting);
  const approve = useHrms((s) => s.approveSetting);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [from, setFrom] = useState<Record<string, string>>({});

  return (
    <div>
      <PageHeader title="Rules engine" subtitle="Every rate is a dated setting with an approver. A backdated change triggers arrears on the next compute." />
      <div className="grid gap-3">
        {settings.map((s) => (
          <Card key={s.id} className="grid gap-3 p-4 md:grid-cols-[1.4fr_120px_1fr]">
            <div>
              <p className="font-semibold">{s.label}</p>
              <p className="text-xs text-muted">
                {s.key} · {s.cadre ?? "all"} · from {s.validFrom} · {s.source}
              </p>
              {s.pendingValue !== undefined && <Badge tone="warn">Pending {String(s.pendingValue)}</Badge>}
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
              <Input
                className="h-10 w-36"
                type="date"
                value={from[s.id] ?? s.validFrom}
                onChange={(e) => setFrom((d) => ({ ...d, [s.id]: e.target.value }))}
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
          </Card>
        ))}
      </div>
    </div>
  );
}

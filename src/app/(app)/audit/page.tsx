"use client";

import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, Input } from "@/components/ui/input";
import { formatStamp } from "@/lib/format";
import { useHrms } from "@/lib/store";
import { useState } from "react";
import { toast } from "sonner";

export default function AuditPage() {
  const audit = useHrms((s) => s.audit);
  const employees = useHrms((s) => s.employees);
  const role = useHrms((s) => s.actingRole);
  const breaches = useHrms((s) => s.breaches);
  const retention = useHrms((s) => s.retention);
  const logBreach = useHrms((s) => s.logBreach);
  const addRetention = useHrms((s) => s.addRetention);
  const [title, setTitle] = useState("Lost USB with gate-pass export");
  const [hold, setHold] = useState("APAR 2020-26");

  return (
    <div>
      <PageHeader
        title="Audit trail"
        subtitle="Append-only. Who, what, when, before and after. Prototype data lives in this browser; production logs stay in India, encrypted at rest."
      />
      <p className="mb-4 text-xs text-muted">
        Hosting: India region (prototype: local device). Encryption: TLS in transit, AES-256 at rest in production. MFA at sign-in.
      </p>
      <Card className="overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-[#f6f8fd] text-left text-xs text-muted">
            <tr>
              <th className="px-4 py-3">When</th>
              <th>Who</th>
              <th>Action</th>
              <th>Object</th>
              <th>Before</th>
              <th className="px-4">After</th>
            </tr>
          </thead>
          <tbody>
            {audit.map((a) => (
              <tr key={a.id} className="border-t border-line">
                <td className="px-4 py-2.5 text-xs">{formatStamp(a.at)}</td>
                <td>{employees.find((e) => e.id === a.actorId)?.preferredName ?? a.actorId}</td>
                <td>{a.action}</td>
                <td className="font-mono text-xs">{a.object}</td>
                <td className="text-xs text-muted">{a.before ?? "—"}</td>
                <td className="px-4 text-xs text-muted">{a.after ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      {role === "auditor" || role === "hr_admin" ? (
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <Card className="p-4">
            <p className="mb-3 font-semibold">DPDP breach</p>
            <Field label="Incident">
              <Input value={title} onChange={(e) => setTitle(e.target.value)} />
            </Field>
            <Button
              className="mt-3"
              onClick={() => {
                logBreach(title);
                toast.success("Logged. Board and DPDP clock started.");
              }}
            >
              Notify board
            </Button>
            {breaches.map((b) => (
              <p key={b.id} className="mt-2 text-sm text-muted">
                {b.title} · notified
              </p>
            ))}
          </Card>
          <Card className="p-4">
            <p className="mb-3 font-semibold">Retention hold</p>
            <Field label="Object">
              <Input value={hold} onChange={(e) => setHold(e.target.value)} />
            </Field>
            <Button
              className="mt-3"
              variant="secondary"
              onClick={() => {
                addRetention(hold, "Legal hold", "2032-03-31");
                toast.success("Hold placed. Cannot erase until 2032.");
              }}
            >
              Place hold
            </Button>
            {retention.map((r) => (
              <p key={r.id} className="mt-2 text-sm text-muted">
                {r.object} until {r.until}
              </p>
            ))}
          </Card>
        </div>
      ) : null}
    </div>
  );
}

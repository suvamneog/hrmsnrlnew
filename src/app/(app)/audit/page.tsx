"use client";

import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, Input } from "@/components/ui/input";
import { downloadText } from "@/lib/files";
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
  const [title, setTitle] = useState("");
  const [hold, setHold] = useState("");
  const [digest, setDigest] = useState<string | null>(null);

  // Long digit runs and PAN-shaped values are masked unless the auditor asks for them.
  const mask = (v = "") => v.replace(/\b\d{6,}\b/g, (m) => `${"x".repeat(m.length - 4)}${m.slice(-4)}`).replace(/\b[A-Z]{5}\d{4}[A-Z]\b/g, "xxxxx####x");

  async function exportHashed(withPii: boolean) {
    const rows = [...audit].sort((x, y) => x.at.localeCompare(y.at));
    const lines = ["at,actor,action,object,before,after,source,chain_sha256"];
    let prev = "";
    const enc = new TextEncoder();
    const hex = (b: ArrayBuffer) => [...new Uint8Array(b)].map((x) => x.toString(16).padStart(2, "0")).join("");
    for (const a of rows) {
      const cells = [a.at, a.actorId, a.action, a.object, withPii ? a.before ?? "" : mask(a.before), withPii ? a.after ?? "" : mask(a.after), a.source].map((c) => `"${String(c).replace(/"/g, "'")}"`);
      // Each row's hash covers the previous one, so editing any row breaks every hash after it.
      prev = hex(await crypto.subtle.digest("SHA-256", enc.encode(prev + cells.join(","))));
      lines.push([...cells, prev].join(","));
    }
    lines.push(`# rows ${rows.length}, final sha256 ${prev}, pii ${withPii ? "included" : "masked"}`);
    downloadText(`nrl-audit-${withPii ? "full" : "masked"}.csv`, lines.join("\n"), "text/csv");
    setDigest(prev);
    if (withPii) addRetention("audit-export", "PII export by auditor", new Date().toISOString().slice(0, 10));
    toast.success(`Exported ${rows.length} rows with a SHA-256 chain`);
  }

  return (
    <div>
      <PageHeader
        title="Audit trail"
        subtitle={digest ? `Last export ends in hash ${digest.slice(0, 16)}. Keep it to prove the file was not edited.` : "Exports hide PII by default and carry a SHA-256 hash chain."}
        actions={
          <>
            <Button onClick={() => exportHashed(false)}>Export, PII masked</Button>
            {role === "auditor" && (
              <Button variant="secondary" onClick={() => exportHashed(true)}>
                Export with PII
              </Button>
            )}
          </>
        }
      />
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
            {[...audit].sort((x, y) => y.at.localeCompare(x.at)).map((a) => (
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

      {role === "hr_admin" ? (
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <Card className="p-4">
            <p className="mb-3 font-semibold">DPDP breach</p>
            <Field label="Incident">
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Incident summary" />
            </Field>
            <Button
              className="mt-3"
              onClick={() => {
                if (!title.trim()) {
                  toast.error("Describe the incident.");
                  return;
                }
                logBreach(title.trim());
                toast.success("Logged. Board and DPDP clock started.");
                setTitle("");
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
              <Input value={hold} onChange={(e) => setHold(e.target.value)} placeholder="Record or file reference" />
            </Field>
            <Button
              className="mt-3"
              variant="secondary"
              onClick={() => {
                if (!hold.trim()) {
                  toast.error("Enter the record to hold.");
                  return;
                }
                addRetention(hold.trim(), "Legal hold", "2032-03-31");
                toast.success("Hold placed. Cannot erase until 2032.");
                setHold("");
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

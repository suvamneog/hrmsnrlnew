"use client";

import { QuickActions } from "@/components/ess/quick-actions";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, Input, Select } from "@/components/ui/input";
import { formatClock, formatDay } from "@/lib/format";
import { positionTitle, unitName } from "@/lib/org";
import { useCurrentUser, useHrms } from "@/lib/store";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";

export default function SelfPage() {
  const me = useCurrentUser();
  const consentsAll = useHrms((s) => s.consents);
  const punchesAll = useHrms((s) => s.punches);
  const run = useHrms((s) => s.payrollRuns[0]);
  const withdrawConsent = useHrms((s) => s.withdrawConsent);
  const giveConsent = useHrms((s) => s.giveConsent);
  const requestChange = useHrms((s) => s.requestChange);
  const changes = useHrms((s) => s.changes);
  const [field, setField] = useState<"phone" | "email" | "bank" | "address">("phone");
  const [to, setTo] = useState("");
  if (!me) return null;
  const consents = consentsAll.filter((c) => c.employeeId === me.id);
  const punches = punchesAll.filter((p) => p.employeeId === me.id).slice(-8);
  const slip = run.results.find((r) => r.employeeId === me.id);
  const mine = changes.filter((c) => c.employeeId === me.id);

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <Card className="p-5">
        <div className="flex items-center gap-4">
          <Avatar name={me.name} size={64} />
          <div className="min-w-0">
            <h1 className="text-2xl font-semibold tracking-tight">{me.name}</h1>
            <p className="text-sm text-muted">
              {me.empNo} · {positionTitle(me.positionId)}
            </p>
            <p className="text-sm text-muted">
              {unitName(me.unitId)} · joined {formatDay(me.doj)}
            </p>
          </div>
        </div>
        <div className="mt-5">
          <QuickActions />
        </div>
      </Card>

      <Card className="p-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-semibold">Documents</h2>
          <Link href="/payslips" className="text-sm font-semibold text-brand">
            All slips
          </Link>
        </div>
        <Link href="/payslips" className="flex items-center justify-between rounded-2xl bg-[#f6f8fd] px-4 py-3">
          <div>
            <p className="text-sm font-semibold">Latest payslip</p>
            <p className="text-xs text-muted">October 2026</p>
          </div>
          <span className="text-sm font-semibold tabular-nums text-brand">{slip ? "Open" : "View"}</span>
        </Link>
      </Card>

      <Card className="p-5">
        <h2 className="mb-3 font-semibold">Change a personal detail</h2>
        <form
          className="grid gap-3 sm:grid-cols-2"
          onSubmit={(e) => {
            e.preventDefault();
            const from = field === "phone" ? me.phone : field === "email" ? me.email : field === "bank" ? `${me.ifsc} ${me.bankAccount}` : me.address ?? "";
            requestChange({ employeeId: me.id, field, from, to });
            toast.success(field === "bank" ? "Bank change sent to finance" : "Sent to HR");
            setTo("");
          }}
        >
          <Field label="Field">
            <Select value={field} onChange={(e) => setField(e.target.value as typeof field)}>
              <option value="phone">Phone</option>
              <option value="email">Email</option>
              <option value="address">Address</option>
              <option value="bank">Bank (IFSC account)</option>
            </Select>
          </Field>
          <Field label="New value">
            <Input value={to} onChange={(e) => setTo(e.target.value)} required />
          </Field>
          <Button type="submit">Submit for approval</Button>
        </form>
        {mine.map((c) => (
          <p key={c.id} className="mt-2 text-xs text-muted">
            {c.field}: {c.from} → {c.to} · {c.status}
          </p>
        ))}
      </Card>

      <Card className="p-5">
        <h2 className="mb-3 font-semibold">Consents (DPDP)</h2>
        <ul className="space-y-2">
          {consents.map((c) => (
            <li key={c.id} className="flex items-center justify-between text-sm">
              <span>{c.purpose}</span>
              <span className="flex items-center gap-2">
                <Badge tone={c.given ? "ok" : "danger"}>{c.given ? "given" : "withdrawn"}</Badge>
                {c.given ? (
                  <button className="text-xs font-semibold text-brand" onClick={() => withdrawConsent(c.id)}>
                    Withdraw
                  </button>
                ) : (
                  <button className="text-xs font-semibold text-brand" onClick={() => giveConsent(c.id)}>
                    Give again
                  </button>
                )}
              </span>
            </li>
          ))}
        </ul>
      </Card>

      <Card className="p-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-semibold">Recent punches</h2>
          <Link href="/time" className="text-sm font-semibold text-brand">
            Attendance
          </Link>
        </div>
        {punches.length === 0 ? (
          <p className="py-4 text-sm text-muted">No biometric punches on this record.</p>
        ) : (
          <ul className="space-y-2">
            {punches
              .slice()
              .reverse()
              .map((p) => (
                <li key={p.id} className="flex items-center justify-between text-sm">
                  <span className="font-medium capitalize">{p.kind}</span>
                  <span className="text-muted">
                    {p.readerId === "WEB-ESS" ? "Phone" : p.readerId} · {formatDay(p.time.slice(0, 10))} {formatClock(p.time)}
                  </span>
                </li>
              ))}
          </ul>
        )}
      </Card>
    </div>
  );
}

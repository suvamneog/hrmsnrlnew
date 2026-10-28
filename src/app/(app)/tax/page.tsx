"use client";

import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DropZone } from "@/components/ui/drop-zone";
import { Field, Input, Select } from "@/components/ui/input";
import { inr } from "@/lib/format";
import { requestTone } from "@/lib/status";
import { useCurrentUser, useHrms } from "@/lib/store";
import { useState } from "react";
import { toast } from "sonner";

export default function TaxPage() {
  const me = useCurrentUser();
  const tax = useHrms((s) => s.tax);
  const submit = useHrms((s) => s.submitTax);
  const [regime, setRegime] = useState<"new" | "old">("new");
  const [section80C, setSection80C] = useState("150000");
  const [rent, setRent] = useState("0");
  const [proofs, setProofs] = useState<File[]>([]);
  if (!me) return null;
  const mine = tax.filter((t) => t.employeeId === me.id);

  return (
    <div>
      <PageHeader title="Tax declaration"
        subtitle="FY 2026-27 regime and proofs for Form 16 and the 24Q return." />
      <div className="grid gap-5 lg:grid-cols-2">
        <Card className="p-5">
          <form
            className="grid gap-3"
            onSubmit={(e) => {
              e.preventDefault();
              submit({
                employeeId: me.id,
                fy: "2026-27",
                regime,
                section80C: Number(section80C),
                rent: Number(rent),
                proofs: proofs.length,
              });
              toast.success("Declaration sent to payroll");
            }}
          >
            <Field label="Regime">
              <Select value={regime} onChange={(e) => setRegime(e.target.value as "new" | "old")}>
                <option value="new">New (default)</option>
                <option value="old">Old, with deductions</option>
              </Select>
            </Field>
            <Field label="Section 80C">
              <Input type="number" value={section80C} onChange={(e) => setSection80C(e.target.value)} />
            </Field>
            <Field label="Rent paid (HRA)">
              <Input type="number" value={rent} onChange={(e) => setRent(e.target.value)} />
            </Field>
            <DropZone
              label="Proofs"
              hint="Form 16A, rent receipts, 80C — drop or browse"
              files={proofs}
              accept="application/pdf,image/*"
              onFiles={setProofs}
            />
            <Button type="submit">Submit FY 2026-27</Button>
          </form>
        </Card>
        <div className="space-y-3">
          {mine.map((t) => (
            <Card key={t.id} className="p-4">
              <div className="flex justify-between">
                <p className="font-semibold">{t.fy} · {t.regime} regime</p>
                <Badge tone={requestTone(t.status)}>{t.status}</Badge>
              </div>
              <p className="mt-2 text-sm text-muted">80C {inr(t.section80C)} · rent {inr(t.rent)} · {t.proofs} proof(s)</p>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

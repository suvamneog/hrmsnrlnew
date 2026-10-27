"use client";

import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, Input, Select, Textarea } from "@/components/ui/input";
import { claimLimit } from "@/lib/ff";
import { inr } from "@/lib/format";
import { requestTone } from "@/lib/status";
import { useCurrentUser, useHrms } from "@/lib/store";
import type { Claim } from "@/lib/types";
import { toast } from "sonner";
import { useState } from "react";

export default function ClaimsPage() {
  const me = useCurrentUser();
  const claims = useHrms((s) => s.claims);
  const apply = useHrms((s) => s.applyClaim);
  const withdrawClaim = useHrms((s) => s.withdrawClaim);
  const advances = useHrms((s) => s.advances);
  const [type, setType] = useState<Claim["type"]>("medical");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [billName, setBillName] = useState("");
  if (!me) return null;

  return (
    <div>
      <PageHeader title="Claims & advances" />
      <div className="grid gap-5 lg:grid-cols-2">
        <Card className="p-5">
          <form
            className="grid gap-3"
            onSubmit={(e) => {
              e.preventDefault();
              const r = apply({
                employeeId: me.id,
                type,
                amount: Number(amount),
                description: billName ? `${description} · ${billName}` : description,
                bills: billName ? 1 : 0,
              });
              if (!r.ok) toast.error(r.reason);
              else toast.success(billName ? `Claim filed with ${billName}` : "Claim filed");
              setDescription("");
              setBillName("");
            }}
          >
            <Field label="Type">
              <Select value={type} onChange={(e) => setType(e.target.value as Claim["type"])}>
                <option value="medical">Medical</option>
                <option value="ltc">LTC</option>
                <option value="cea">Children&apos;s education</option>
                <option value="tour">Tour / travel</option>
                <option value="cafeteria">Cafeteria item</option>
              </Select>
            </Field>
            <Field label="Amount (INR)">
              <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0" />
            </Field>
            <Field label="Description">
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)} required />
            </Field>
            <Field label="Bill">
              <Input
                type="file"
                accept="image/*,application/pdf"
                onChange={(e) => setBillName(e.target.files?.[0]?.name ?? "")}
              />
            </Field>
            {billName && <p className="text-xs text-muted">Attached {billName}.</p>}
            <p className="text-xs text-muted">{me.grade} annual {type} limit {inr(claimLimit(me.grade, type))}. Amount ≥ ₹25,000 goes to finance.</p>
            <Button type="submit">Submit claim</Button>
          </form>
        </Card>
        <div className="space-y-3">
          {claims
            .filter((c) => c.employeeId === me.id)
            .map((c) => (
              <Card key={c.id} className="flex items-center justify-between p-4">
                <div>
                  <p className="font-semibold">{c.type.toUpperCase()} · {inr(c.amount)}</p>
                  <p className="text-sm text-muted">{c.description}</p>
                </div>
                <span className="flex items-center gap-2">
                  <Badge tone={requestTone(c.status)}>{c.status}</Badge>
                  {c.status === "pending" && (
                    <button className="text-xs font-semibold text-brand" onClick={() => withdrawClaim(c.id)}>
                      Withdraw
                    </button>
                  )}
                </span>
              </Card>
            ))}
          {advances
            .filter((a) => a.employeeId === me.id)
            .map((a) => (
              <Card key={a.id} className="p-4">
                <p className="text-xs text-muted">{a.type} advance</p>
                <p className="font-semibold">Outstanding {inr(a.outstanding)}</p>
                <p className="text-sm text-muted">Recovery {inr(a.monthlyRecovery)} / month</p>
              </Card>
            ))}
        </div>
      </div>
    </div>
  );
}

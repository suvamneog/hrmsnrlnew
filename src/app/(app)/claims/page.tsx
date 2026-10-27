"use client";

import { Fact, Ring } from "@/components/home/viz";
import { PageHeader } from "@/components/layout/page-header";
import { InView } from "@/components/motion/in-view";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { HeroCard } from "@/components/ui/hero-card";
import { Field, Input, Select, Textarea } from "@/components/ui/input";
import { cn } from "@/lib/cn";
import { ADVANCE_RULES, claimLimit } from "@/lib/ff";
import { formatDay, inr } from "@/lib/format";
import { requestTone } from "@/lib/status";
import { useCurrentUser, useHrms } from "@/lib/store";
import type { Advance, Claim } from "@/lib/types";
import { Car, FirstAid, Gift, GraduationCap, House, Paperclip, Train, Wallet } from "@phosphor-icons/react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";

const TYPES: { id: Claim["type"]; label: string; icon: typeof FirstAid }[] = [
  { id: "medical", label: "Medical", icon: FirstAid },
  { id: "ltc", label: "LTC", icon: Train },
  { id: "cea", label: "Children's education", icon: GraduationCap },
  { id: "tour", label: "Tour / travel", icon: Wallet },
  { id: "cafeteria", label: "Cafeteria", icon: Gift },
];

const ADV_ICON = { festival: Gift, vehicle: Car, hba: House } as const;

// Claims count against the financial year that starts in April.
const FY_START = "2026-04-01";

function route(amount: number) {
  if (amount >= 25000) return 2;
  if (amount >= 10000) return 1;
  return 0;
}

export default function ClaimsPage() {
  const me = useCurrentUser();
  const claims = useHrms((s) => s.claims);
  const apply = useHrms((s) => s.applyClaim);
  const withdrawClaim = useHrms((s) => s.withdrawClaim);
  const advances = useHrms((s) => s.advances);
  const applyAdvance = useHrms((s) => s.applyAdvance);
  const [type, setType] = useState<Claim["type"]>("medical");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [billName, setBillName] = useState("");
  const [advType, setAdvType] = useState<Advance["type"]>("festival");
  const [advAmount, setAdvAmount] = useState("");
  const [advN, setAdvN] = useState("10");
  if (!me) return null;

  const mine = claims.filter((c) => c.employeeId === me.id);
  const usedFor = (t: Claim["type"]) =>
    mine
      .filter((c) => c.type === t && (c.status === "approved" || c.status === "pending") && c.submittedAt >= FY_START)
      .reduce((n, c) => n + c.amount, 0);
  const limit = claimLimit(me.grade, type);
  const used = usedFor(type);
  const left = Math.max(0, limit - used);
  const amt = Number(amount) || 0;
  const step = route(amt);
  const myAdvances = advances.filter((a) => a.employeeId === me.id);
  const rule = ADVANCE_RULES[advType];
  const advMonthly = Math.ceil((Number(advAmount) || 0) / Math.max(1, Number(advN) || 1));

  return (
    <div className="space-y-5">
      <PageHeader title="Claims & advances" subtitle={`FY 2026-27 · ${me.grade} limits`} />

      <InView>
        <HeroCard eyebrow="This financial year" title={`${inr(TYPES.reduce((n, t) => n + usedFor(t.id), 0))} claimed so far`}>
          <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-5">
            {TYPES.map((t) => {
              const lim = claimLimit(me.grade, t.id);
              const u = usedFor(t.id);
              const share = lim ? u / lim : 0;
              return (
                <button
                  key={t.id}
                  onClick={() => setType(t.id)}
                  className={cn(
                    "flex flex-col items-center gap-3 rounded-2xl p-3 transition",
                    type === t.id ? "bg-white shadow-[0_8px_24px_rgba(45,64,180,0.12)] ring-1 ring-brand/20" : "hover:bg-[#f6f8fd]",
                  )}
                >
                  <Ring value={u} max={Math.max(1, lim)} size={92} stroke={8} color={share > 0.85 ? "#e0a43d" : "var(--brand)"}>
                    <t.icon size={22} weight="duotone" className="text-brand" />
                  </Ring>
                  <div className="text-center">
                    <p className="text-[13px] font-semibold">{t.label}</p>
                    <p className="text-[11px] tabular-nums text-muted">
                      {lim ? `${inr(u)} of ${inr(lim)}` : "Not eligible"}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </HeroCard>
      </InView>

      <div className="grid gap-5 *:min-w-0 lg:grid-cols-[1.1fr_1fr]">
        <InView delay={0.05}>
          <Card className="p-6">
            <h2 className="text-lg font-semibold tracking-tight">New claim</h2>
            <p className="mt-0.5 text-sm text-muted">Attach bills. The route depends on the amount.</p>
            <form
              className="mt-5 grid gap-4"
              onSubmit={(e) => {
                e.preventDefault();
                if (!billName) {
                  toast.error("Attach at least one bill.");
                  return;
                }
                const r = apply({
                  employeeId: me.id,
                  type,
                  amount: amt,
                  description: `${description} · ${billName}`,
                  bills: 1,
                });
                if (!r.ok) toast.error(r.reason);
                else {
                  toast.success("Claim filed");
                  setAmount("");
                  setDescription("");
                  setBillName("");
                }
              }}
            >
              <div className="flex flex-wrap gap-2">
                {TYPES.map((t) => (
                  <button
                    type="button"
                    key={t.id}
                    onClick={() => setType(t.id)}
                    className={cn(
                      "relative rounded-full px-3.5 py-1.5 text-[13px] font-semibold transition",
                      type === t.id ? "text-white" : "bg-[#f3f5fb] text-ink hover:bg-[#e9edf8]",
                    )}
                  >
                    {type === t.id && (
                      <motion.span layoutId="claim-type" className="absolute inset-0 rounded-full bg-brand" transition={{ type: "spring", stiffness: 400, damping: 32 }} />
                    )}
                    <span className="relative">{t.label}</span>
                  </button>
                ))}
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Amount (INR)">
                  <Input type="number" min={1} value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0" required />
                </Field>
                <div className="rounded-2xl bg-[#f6f8fd] px-4 py-3">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">Left this year</p>
                  <p className={cn("mt-1 text-lg font-semibold tabular-nums", amt > left && "text-[#d13b3b]")}>{inr(left)}</p>
                </div>
              </div>
              <Field label="Description">
                <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Hospital, travel dates, child's school…" required />
              </Field>
              <label className="flex cursor-pointer items-center gap-3 rounded-2xl border border-dashed border-line px-4 py-3 text-sm transition hover:border-brand hover:bg-brand-soft">
                <Paperclip size={18} className="text-brand" />
                <span className="flex-1 truncate">{billName || "Attach bill (PDF or photo)"}</span>
                <input type="file" accept="image/*,application/pdf" className="hidden" onChange={(e) => setBillName(e.target.files?.[0]?.name ?? "")} />
              </label>

              <div>
                <p className="mb-2 text-[12px] font-semibold text-muted">Approval route</p>
                <div className="flex items-center gap-2">
                  {["Line manager", "HR", "Finance"].map((who, i) => (
                    <div key={who} className="flex flex-1 items-center gap-2">
                      <span
                        className={cn(
                          "flex-1 rounded-full px-3 py-1.5 text-center text-[12px] font-semibold transition",
                          i === step && amt > 0 ? "bg-brand text-white" : "bg-[#f3f5fb] text-muted",
                        )}
                      >
                        {who}
                      </span>
                      {i < 2 && <span className="text-muted">›</span>}
                    </div>
                  ))}
                </div>
                <p className="mt-2 text-[11px] text-muted">Under ₹10,000 to your manager · ₹10,000–24,999 to HR · ₹25,000 and above to finance.</p>
              </div>
              <Button type="submit" className="justify-self-start">Submit claim</Button>
            </form>
          </Card>
        </InView>

        <InView delay={0.1}>
          <Card className="p-6">
            <h2 className="text-lg font-semibold tracking-tight">Your claims</h2>
            {mine.length === 0 ? (
              <p className="mt-6 text-center text-sm text-muted">No claims filed this year.</p>
            ) : (
              <ol className="relative mt-5 space-y-4 border-l border-line pl-5">
                {mine.map((c) => (
                  <li key={c.id} className="relative">
                    <span
                      className={cn(
                        "absolute -left-[26px] top-1.5 h-2.5 w-2.5 rounded-full ring-4 ring-white",
                        c.status === "approved" ? "bg-[#0f9f6e]" : c.status === "rejected" ? "bg-[#d13b3b]" : "bg-[#e0a43d]",
                      )}
                    />
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold">
                          {TYPES.find((t) => t.id === c.type)?.label} · {inr(c.amount)}
                        </p>
                        <p className="truncate text-[12px] text-muted">{c.description}</p>
                        <p className="mt-0.5 text-[11px] text-muted">
                          {formatDay(c.submittedAt.slice(0, 10))} · {c.bills} bill{c.bills === 1 ? "" : "s"} · to{" "}
                          {["line manager", "HR", "finance"][route(c.amount)]}
                        </p>
                      </div>
                      <div className="flex shrink-0 flex-col items-end gap-1">
                        <Badge tone={requestTone(c.status)}>{c.status}</Badge>
                        {c.status === "pending" && (
                          <button className="text-[11px] font-semibold text-brand" onClick={() => withdrawClaim(c.id)}>
                            Withdraw
                          </button>
                        )}
                      </div>
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </Card>
        </InView>
      </div>

      <InView delay={0.05}>
        <Card className="p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold tracking-tight">Advances</h2>
              <p className="mt-0.5 text-sm text-muted">Recovered from salary each month once HR approves.</p>
            </div>
          </div>
          <div className="mt-5 grid gap-6 lg:grid-cols-[1fr_1.2fr]">
            <form
              className="grid gap-4"
              onSubmit={(e) => {
                e.preventDefault();
                const r = applyAdvance(advType, Number(advAmount), Number(advN));
                if (!r.ok) toast.error(r.reason);
                else {
                  toast.success("Advance requested. HR will review it.");
                  setAdvAmount("");
                }
              }}
            >
              <div className="grid grid-cols-3 gap-2">
                {(Object.keys(ADVANCE_RULES) as Advance["type"][]).map((k) => {
                  const Icon = ADV_ICON[k];
                  return (
                    <button
                      type="button"
                      key={k}
                      onClick={() => {
                        setAdvType(k);
                        setAdvN(String(ADVANCE_RULES[k].instalments));
                      }}
                      className={cn(
                        "flex flex-col items-center gap-1.5 rounded-2xl border px-2 py-3 text-[12px] font-semibold transition",
                        advType === k ? "border-brand bg-brand-soft text-brand" : "border-line hover:border-brand/40",
                      )}
                    >
                      <Icon size={20} weight="duotone" />
                      {ADVANCE_RULES[k].label}
                    </button>
                  );
                })}
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label={`Amount (max ${inr(rule.max(me.grade))})`}>
                  <Input type="number" min={1} value={advAmount} onChange={(e) => setAdvAmount(e.target.value)} placeholder="0" required />
                </Field>
                <Field label={`Instalments (max ${rule.instalments})`}>
                  <Select value={advN} onChange={(e) => setAdvN(e.target.value)}>
                    {[...new Set([Math.min(5, rule.instalments), Math.round(rule.instalments / 2), rule.instalments])].map((n) => (
                      <option key={n} value={n}>
                        {n} months
                      </option>
                    ))}
                  </Select>
                </Field>
              </div>
              <div className="flex items-center justify-between rounded-2xl bg-[#f6f8fd] px-4 py-3 text-sm">
                <span className="text-muted">Monthly recovery</span>
                <span className="font-semibold tabular-nums">{advMonthly ? inr(advMonthly) : "—"}</span>
              </div>
              <Button type="submit" variant="secondary" className="justify-self-start">
                Request advance
              </Button>
            </form>

            <div className="space-y-3">
              {myAdvances.length === 0 && <p className="py-6 text-center text-sm text-muted">No advances running.</p>}
              {myAdvances.map((a) => {
                const repaid = a.principal - a.outstanding;
                const Icon = ADV_ICON[a.type];
                return (
                  <div key={a.id} className="rounded-2xl border border-line p-4">
                    <div className="flex items-center gap-3">
                      <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-soft text-brand">
                        <Icon size={20} weight="duotone" />
                      </span>
                      <div className="flex-1">
                        <p className="text-sm font-semibold">
                          {ADVANCE_RULES[a.type].label} advance · {inr(a.principal)}
                        </p>
                        <p className="text-[12px] text-muted">{inr(a.monthlyRecovery)} a month</p>
                      </div>
                      <Badge tone={requestTone(a.status ?? "approved")}>{a.status ?? "running"}</Badge>
                    </div>
                    <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#eef1f8]">
                      <motion.div
                        className="h-full rounded-full bg-[#0f9f6e]"
                        initial={{ width: 0 }}
                        whileInView={{ width: `${(repaid / a.principal) * 100}%` }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
                      />
                    </div>
                    <div className="mt-2 grid grid-cols-2 gap-x-6 text-[12px]">
                      <Fact label="Repaid" value={inr(repaid)} tone="ok" />
                      <Fact label="Outstanding" value={inr(a.outstanding)} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </Card>
      </InView>
    </div>
  );
}

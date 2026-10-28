"use client";

import { Field, Grid2, Panel, Pill, Rows, Stats } from "@/components/desk/kit";
import { WageAndPasses } from "@/components/contract/wage-and-passes";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { DEMO_TODAY } from "@/lib/demo";
import { useDesk } from "@/lib/desk";
import { musterVsGate } from "@/lib/desk-analytics";
import { formatDay, inr, monthLabel } from "@/lib/format";
import { insideNow } from "@/lib/gate";
import { useCurrentUser, useHrms } from "@/lib/store";
import { useMemo, useState } from "react";
import { toast } from "sonner";

const MUSTER_TONE = { submitted: "warn", verified: "ok", disputed: "danger" } as const;

/* Contractor muster against the gate, worker requests, and EPF and ESI challans. */
export default function MusterPage() {
  const me = useCurrentUser();
  const role = useHrms((s) => s.actingRole);
  const contractorsAll = useHrms((s) => s.contractors);
  const workersAll = useHrms((s) => s.workers);
  const passes = useHrms((s) => s.passes);
  const events = useHrms((s) => s.gateEvents);
  const registerWorker = useHrms((s) => s.registerWorker);
  const desk = useDesk();
  const supervisor = role === "contractor_supervisor";
  const cell = role === "contract_labour_cell";
  const contractors = supervisor ? contractorsAll.filter((c) => c.supervisorId === me?.id || c.id === me?.contractorId) : contractorsAll;
  const [cid, setCid] = useState(contractors[0]?.id ?? "");
  const [ticked, setTicked] = useState<Set<string>>(new Set());
  const [req, setReq] = useState({ name: "", trade: "Rigger" });
  const ids = new Set(contractors.map((c) => c.id));
  const crew = useMemo(() => workersAll.filter((w) => w.contractorId === cid && !w.blacklisted), [workersAll, cid]);
  if (!me) return null;

  const cname = (id: string) => contractorsAll.find((c) => c.id === id)?.name ?? id;
  const wname = (id: string) => workersAll.find((w) => w.id === id)?.name ?? id;
  const musters = desk.musters.filter((m) => ids.has(m.contractorId));
  const requests = desk.workerRequests.filter((r) => ids.has(r.contractorId));
  const challans = desk.challans.filter((c) => ids.has(c.contractorId));
  const gaps = musters.reduce((n, m) => n + musterVsGate(m.workerIds, m.date, passes, events).filter((x) => !x.seen).length, 0);

  const load = contractors.map((c) => {
    const inside = insideNow(events, passes, new Set(workersAll.filter((w) => w.contractorId === c.id).map((w) => w.id))).size;
    return { id: c.id, name: c.name, inside, cap: c.capacity ?? 0 };
  });

  return (
    <div className="space-y-6">
      <PageHeader title="Muster and challans" subtitle="Days claimed on muster are checked against the gate before wages are paid." />

      <Stats
        items={[
          { label: "Musters to check", value: musters.filter((m) => m.status === "submitted").length, tone: "warn" },
          { label: "Claimed but not seen at gate", value: gaps, tone: gaps ? "danger" : "ok", hint: "Worker days" },
          { label: "Worker requests", value: requests.filter((r) => r.status === "pending").length },
          { label: "Challans short", value: challans.filter((c) => c.status === "short").length, tone: "danger" },
        ]}
      />

      <Panel title="Muster against gate" note="A worker on the muster with no gate entry that day is a claim to dispute.">
        <Rows
          items={musters}
          empty="No musters submitted yet."
          render={(m) => {
            const check = musterVsGate(m.workerIds, m.date, passes, events);
            const missing = check.filter((x) => !x.seen);
            return (
              <>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-ink">
                    {cname(m.contractorId)}, {formatDay(m.date)}
                  </p>
                  <p className="text-[12px] text-muted">
                    {m.workerIds.length} on muster, {check.length - missing.length} seen at gate
                    {missing.length ? `. Not seen: ${missing.map((x) => wname(x.workerId)).join(", ")}` : ""}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Pill tone={MUSTER_TONE[m.status]}>{m.status === "submitted" ? "To check" : m.status === "verified" ? "Verified" : "Disputed"}</Pill>
                  {cell && m.status === "submitted" && (
                    <>
                      <Button variant="secondary" className="h-8 px-3.5 text-[13px]" onClick={() => desk.decideMuster(m.id, "disputed", `${missing.length} days not seen at gate`)}>
                        Dispute
                      </Button>
                      <Button className="h-8 px-3.5 text-[13px]" disabled={missing.length > 0} onClick={() => desk.decideMuster(m.id, "verified")}>
                        Verify
                      </Button>
                    </>
                  )}
                </div>
              </>
            );
          }}
        />
      </Panel>

      <Grid2>
        {supervisor ? (
          <Panel title="Submit today's muster" note={`${formatDay(DEMO_TODAY)}. Tick everyone who worked.`}>
            <div className="mb-4 flex flex-wrap items-center gap-3">
              <Select value={cid} onChange={(e) => setCid(e.target.value)} className="h-9 w-auto">
                {contractors.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </Select>
              <button type="button" className="text-[13px] font-semibold text-brand" onClick={() => setTicked(new Set(crew.map((w) => w.id)))}>
                Tick all {crew.length}
              </button>
            </div>
            <div className="grid max-h-72 gap-1 overflow-auto pr-1 sm:grid-cols-2">
              {crew.slice(0, 40).map((w) => (
                <label key={w.id} className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2 py-2 text-sm hover:bg-subtle">
                  <input
                    type="checkbox"
                    className="h-4 w-4 accent-[var(--brand)]"
                    checked={ticked.has(w.id)}
                    onChange={() => {
                      const n = new Set(ticked);
                      if (n.has(w.id)) n.delete(w.id);
                      else n.add(w.id);
                      setTicked(n);
                    }}
                  />
                  <span className="truncate">{w.name}</span>
                </label>
              ))}
            </div>
            <div className="mt-4">
              <Button
                disabled={!ticked.size}
                onClick={() => {
                  desk.submitMuster({ contractorId: cid, date: DEMO_TODAY, workerIds: [...ticked], submittedBy: me.id });
                  toast.success(`Muster of ${ticked.size} sent to the Contract Labour Cell`);
                  setTicked(new Set());
                }}
              >
                Submit {ticked.size || ""}
              </Button>
            </div>
          </Panel>
        ) : (
          <Panel title="Licence capacity" note="Workers inside now against the most the labour licence allows.">
            <Rows
              items={load}
              empty="No contractors."
              render={(c) => {
                const share = c.cap ? c.inside / c.cap : 0;
                return (
                  <>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-ink">{c.name}</p>
                      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-fill">
                        <div className="h-full rounded-full transition-[width] duration-700" style={{ width: `${Math.min(100, share * 100)}%`, background: share >= 0.9 ? "#d13b3b" : share >= 0.75 ? "#c47b00" : "var(--brand)" }} />
                      </div>
                    </div>
                    <span className="flex items-center gap-2">
                      <span className="text-[13px] tabular-nums text-muted">
                        {c.inside} of {c.cap}
                      </span>
                      {share >= 0.9 && <Pill tone="danger">Near limit</Pill>}
                    </span>
                  </>
                );
              }}
            />
          </Panel>
        )}

        <Panel title="Worker additions" note={supervisor ? "Ask the Contract Labour Cell to register a new worker." : "Supervisors ask; you register."}>
          <Rows
            items={requests}
            empty="No requests."
            render={(r) => (
              <>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-ink">
                    {r.name}, {r.trade}
                  </p>
                  <p className="text-[12px] text-muted">{cname(r.contractorId)}</p>
                </div>
                {cell && r.status === "pending" ? (
                  <div className="flex gap-2">
                    <Button variant="secondary" className="h-8 px-3.5 text-[13px]" onClick={() => desk.decideWorker(r.id, "rejected")}>
                      Reject
                    </Button>
                    <Button
                      className="h-8 px-3.5 text-[13px]"
                      onClick={() => {
                        registerWorker({ contractorId: r.contractorId, name: r.name, skill: r.trade, aadhaar: "", uan: "", esic: "", policeVerification: false, medicalFitnessExpiry: DEMO_TODAY, photoSeed: r.name });
                        desk.decideWorker(r.id, "approved");
                        toast.success(`${r.name} registered. Induction and police check pending.`);
                      }}
                    >
                      Register
                    </Button>
                  </div>
                ) : (
                  <Pill tone={r.status === "approved" ? "ok" : r.status === "rejected" ? "danger" : "warn"}>{r.status === "pending" ? "Waiting" : r.status === "approved" ? "Registered" : "Rejected"}</Pill>
                )}
              </>
            )}
          />
          {supervisor && (
            <form
              className="mt-4 grid gap-4 border-t border-fill pt-4 sm:grid-cols-[minmax(0,1fr)_160px]"
              onSubmit={(e) => {
                e.preventDefault();
                if (req.name.trim().length < 3) return toast.error("Enter the worker's full name.");
                desk.requestWorker({ contractorId: cid, name: req.name.trim(), trade: req.trade, requestedBy: me.id });
                toast.success("Request sent");
                setReq({ ...req, name: "" });
              }}
            >
              <Field label="Worker name">
                <Input value={req.name} onChange={(e) => setReq({ ...req, name: e.target.value })} />
              </Field>
              <Field label="Trade">
                <Select value={req.trade} onChange={(e) => setReq({ ...req, trade: e.target.value })}>
                  {["Rigger", "Welder-6G", "Fitter", "Scaffolder", "Helper", "Electrician"].map((t) => (
                    <option key={t}>{t}</option>
                  ))}
                </Select>
              </Field>
              <div>
                <Button type="submit">Request</Button>
              </div>
            </form>
          )}
        </Panel>
      </Grid2>

      <Panel title="EPF and ESI challans" note="Paid amount against the contribution due on the wage sheet.">
        <Rows
          items={challans}
          empty="No challans."
          render={(c) => (
            <>
              <div className="min-w-0">
                <p className="text-sm font-medium text-ink">
                  {cname(c.contractorId)}, {c.kind}, {monthLabel(c.month)}
                </p>
                <p className="text-[12px] tabular-nums text-muted">
                  Paid {inr(c.paid)} of {inr(c.due)} due
                  {c.paid < c.due ? `, short by ${inr(c.due - c.paid)}` : ""}
                </p>
              </div>
              {cell && c.status === "pending" ? (
                <Button variant="secondary" className="h-8 px-3.5 text-[13px]" onClick={() => desk.checkChallan(c.id)}>
                  Check
                </Button>
              ) : (
                <Pill tone={c.status === "verified" ? "ok" : c.status === "short" ? "danger" : "warn"}>{c.status === "pending" ? "To check" : c.status === "verified" ? "Verified" : "Short paid"}</Pill>
              )}
            </>
          )}
        />
      </Panel>
      {!supervisor && <WageAndPasses />}
    </div>
  );
}

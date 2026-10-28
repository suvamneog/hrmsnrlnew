"use client";

import { GateCharts } from "@/components/charts/page-charts";

import { Avatar } from "@/components/ui/avatar";
import { PassTicket } from "@/components/ui/pass-ticket";
import { ScrambleText } from "@/components/ui/scramble-text";
import { ScrollFade } from "@/components/ui/scroll-fade";
import { TactileButton } from "@/components/ui/tactile-button";
import { Input } from "@/components/ui/input";
import { maskAadhaar } from "@/lib/format";
import { passBlockReason, insideNow } from "@/lib/gate";
import { useHrms } from "@/lib/store";
import { motion } from "motion/react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { toast } from "sonner";

export default function GatePage() {
  const workers = useHrms((s) => s.workers);
  const passes = useHrms((s) => s.passes);
  const contractors = useHrms((s) => s.contractors);
  const events = useHrms((s) => s.gateEvents);
  const record = useHrms((s) => s.recordGate);
  const certs = useHrms((s) => s.certificates);
  const offline = useHrms((s) => s.gateOffline);
  const queue = useHrms((s) => s.gateQueue);
  const setGateOffline = useHrms((s) => s.setGateOffline);
  const flushGateQueue = useHrms((s) => s.flushGateQueue);
  const role = useHrms((s) => s.actingRole);
  const me = useHrms((s) => s.employees.find((e) => e.id === s.currentUserId));
  const logout = useHrms((s) => s.logout);
  const router = useRouter();
  const [q, setQ] = useState("");
  const [flash, setFlash] = useState<"ok" | "no" | null>(null);
  const [picked, setPicked] = useState(passes[0]?.id ?? "");
  const pass = passes.find((p) => p.id === picked);
  const worker = workers.find((w) => w.id === pass?.workerId);
  const contractor = contractors.find((c) => c.id === worker?.contractorId);

  const visiblePasses =
    role === "contractor_supervisor"
      ? passes.filter((p) => workers.find((w) => w.id === p.workerId)?.contractorId === me?.contractorId)
      : passes;

  const inside = useMemo(() => insideNow(events, visiblePasses).size, [events, visiblePasses]);

  function scan(direction: "in" | "out") {
    const r = record(picked, "Gate 2", direction);
    setFlash(r.ok ? "ok" : "no");
    if (r.ok) toast.success(direction === "in" ? "Entry allowed" : "Exit recorded");
    else toast.error(r.reason);
    setTimeout(() => setFlash(null), 1200);
  }

  return (
    <div className="mx-auto max-w-3xl">
      <GateCharts />
      <div className="mb-6 flex items-end justify-between">
        <div>
          <p className="text-sm text-muted">Gate 2 · CDU west</p>
          <h1 className="text-3xl font-semibold tracking-tight">Pass check</h1>
        </div>
        <div className="flex items-center gap-3">
          {role === "gate_security" && (
          <button
            className="rounded-full bg-white px-3 py-2 text-xs font-semibold"
            onClick={() => {
              if (offline) flushGateQueue();
              else setGateOffline(true);
            }}
          >
            {offline ? `Sync ${queue.length}` : "Work offline"}
          </button>
          )}
          <div className="rounded-2xl bg-white px-4 py-3 text-right shadow-[0_10px_30px_rgba(45,64,180,0.07)]">
            <p className="text-xs text-muted">Headcount inside</p>
            <p className="text-2xl font-semibold">{inside}</p>
          </div>
          {role === "gate_security" && (
            <button
              className="rounded-full bg-white px-3 py-2 text-xs font-semibold"
              onClick={() => {
                logout();
                router.push("/");
              }}
            >
              Sign out
            </button>
          )}
        </div>
      </div>
      <motion.div
        animate={{
          boxShadow:
            flash === "ok"
              ? "0 0 0 6px rgba(15,159,110,0.35)"
              : flash === "no"
                ? "0 0 0 6px rgba(225,75,75,0.35)"
                : "0 10px 30px rgba(45,64,180,0.07)",
        }}
        className="rounded-[28px] bg-white p-6"
      >
        <Input
          placeholder="Search worker or scan pass"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="mb-4 h-14 rounded-2xl text-lg"
        />
        <ScrollFade className="mb-5 grid max-h-40 grid-cols-2 gap-2">
          {visiblePasses
            .filter((p) => {
              const w = workers.find((x) => x.id === p.workerId);
              return !q || w?.name.toLowerCase().includes(q.toLowerCase()) || p.id.includes(q);
            })
            .slice(0, q ? 24 : 12)
            .map((p) => {
              const w = workers.find((x) => x.id === p.workerId)!;
              return (
                <button
                  key={p.id}
                  onClick={() => setPicked(p.id)}
                  className={`flex items-center gap-2 rounded-2xl px-3 py-2 text-left ${picked === p.id ? "bg-brand-soft" : "bg-[#f6f8fd]"}`}
                >
                  <Avatar name={w.name} size={32} />
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold">{w.name}</span>
                    <span className="text-[11px] text-muted">{p.id.toUpperCase()}</span>
                  </span>
                </button>
              );
            })}
        </ScrollFade>
        {worker && pass && (
          <PassTicket tone={passBlockReason({ worker, contractor, certs }) ? "no" : "ok"}>
            <div className="flex items-center gap-4">
              <Avatar name={worker.name} size={72} />
              <div>
                <p className="text-xl font-semibold">{worker.name}</p>
                <p className="text-sm text-muted">
                  {worker.skill} · {contractor?.name}
                </p>
                <p className="font-mono text-xs text-muted">{maskAadhaar(worker.aadhaar)}</p>
                <p className="mt-1 font-mono text-[11px] font-semibold text-brand">
                  <ScrambleText value={pass.id.toUpperCase()} />
                </p>
              </div>
            </div>
            <div className="my-4 border-t border-dashed border-line" />
            <p className={`text-lg font-semibold ${passBlockReason({ worker, contractor, certs }) ? "text-[#d13b3b]" : "text-[#0f9f6e]"}`}>
              {passBlockReason({ worker, contractor, certs }) ?? "All checks valid. Allow entry."}
            </p>
            {role === "gate_security" && (
            <div className="mt-5 flex gap-3">
              <TactileButton
                className="min-w-[140px]"
                variant="mint"
                disabled={!!passBlockReason({ worker, contractor, certs })}
                onClick={() => scan("in")}
              >
                In
              </TactileButton>
              <TactileButton className="min-w-[140px]" variant="secondary" onClick={() => scan("out")}>
                Out
              </TactileButton>
            </div>
            )}
          </PassTicket>
        )}
      </motion.div>
    </div>
  );
}

"use client";

import { DemoNotice } from "@/components/layout/demo-notice";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { InView, Item, Stagger } from "@/components/motion/in-view";
import { DEMOS, EMPLOYEES } from "@/lib/seed";
import { useHrms } from "@/lib/store";
import type { Role } from "@/lib/types";
import { motion, useReducedMotion } from "motion/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export default function LoginPage() {
  const login = useHrms((s) => s.login);
  const userId = useHrms((s) => s.currentUserId);
  const hydrated = useHrms((s) => s.hydrated);
  const router = useRouter();
  const reduce = useReducedMotion();
  const [picked, setPicked] = useState(DEMOS[0]);
  const [mfa, setMfa] = useState("");
  const [step, setStep] = useState<"pick" | "mfa">("pick");
  const reset = useHrms((s) => s.resetDemo);

  useEffect(() => {
    if (hydrated && userId) router.replace("/home");
  }, [hydrated, userId, router]);

  function enter(role: Role, id: string) {
    if (step === "pick") {
      setStep("mfa");
      return;
    }
    if (mfa.replace(/\s/g, "") !== "246810") {
      toast.error("Authenticator code is 246810 in this prototype.");
      return;
    }
    login(id, role);
    router.push(role === "gate_security" ? "/gate" : "/home");
  }

  const person = EMPLOYEES.find((e) => e.id === picked.employeeId)!;

  return (
    <div className="relative min-h-[100dvh] overflow-hidden bg-[#edf1fb]">
      <div className="pointer-events-none absolute -left-24 -top-24 h-80 w-80 rounded-full bg-[#c9d4ff] blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 right-0 h-96 w-96 rounded-full bg-[#d7c9ff] blur-3xl" />
      <div className="mx-auto grid min-h-[100dvh] max-w-6xl items-center gap-10 px-6 py-10 lg:grid-cols-[1.05fr_1fr]">
        <motion.div
          initial={reduce ? false : { opacity: 0, x: -24 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="relative flex max-h-[calc(100dvh-3rem)] flex-col overflow-hidden rounded-[32px] bg-[#3d5afe] p-7 text-white shadow-[0_30px_80px_rgba(61,90,254,0.35)] md:p-10"
        >
          <div className="mb-6 flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-white/15 text-lg font-bold">N</span>
            <div>
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold tracking-tight">NRL People</p>
                <span className="rounded-full bg-white/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white/80">
                  Prototype
                </span>
              </div>
              <p className="text-xs text-white/70">Numaligarh Refinery Limited</p>
            </div>
          </div>
          <h1 className="max-w-sm text-[34px] font-semibold leading-[1.1] tracking-tight">
            Your work, pay and crew. One place.
          </h1>
          <p className="mt-3 max-w-md text-sm leading-6 text-white/80">
            Custom HRMS for a 24x7 refinery. DPE pay, workmen settlement, gate passes and a rules engine instead of another SAP ticket.
          </p>
          <DemoNotice tone="login" />
          <div className="mt-6 grid min-h-0 flex-1 gap-3">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/60">
              {step === "mfa" ? "Authenticator" : "Sign in as"}
            </p>
            {step === "mfa" && (
              <div className="rounded-2xl bg-white/10 p-4">
                <p className="text-sm text-white/80">NRL AD · second factor for {person.preferredName}</p>
                <input
                  value={mfa}
                  onChange={(e) => setMfa(e.target.value)}
                  inputMode="numeric"
                  placeholder="246810"
                  className="mt-3 h-12 w-full rounded-xl bg-white px-4 text-lg tracking-[0.4em] text-ink outline-none"
                  autoFocus
                />
                <p className="mt-2 text-xs text-white/60">Demo code 246810. Production uses NRL AD MFA.</p>
                <button className="mt-3 text-xs font-semibold text-white/80" onClick={() => setStep("pick")}>
                  Back
                </button>
              </div>
            )}
            <Stagger className={`grid max-h-[38vh] grid-cols-1 gap-1.5 overflow-y-auto pr-1 sm:grid-cols-2 ${step === "mfa" ? "hidden" : ""}`}>
              {DEMOS.map((d) => {
                const e = EMPLOYEES.find((x) => x.id === d.employeeId)!;
                const on = picked.role === d.role;
                return (
                  <Item key={d.role}>
                    <button
                      onClick={() => setPicked(d)}
                      className={`flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left transition ${
                        on ? "bg-white text-ink" : "bg-white/10 hover:bg-white/15"
                      }`}
                    >
                      <Avatar name={e.name} size={36} />
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-semibold">{e.name}</span>
                        <span className={`block truncate text-xs ${on ? "text-muted" : "text-white/70"}`}>
                          {d.blurb}
                        </span>
                      </span>
                    </button>
                  </Item>
                );
              })}
            </Stagger>
          </div>
          <Button
            className="mt-5 h-12 w-full shrink-0 bg-white text-brand hover:bg-white"
            variant="secondary"
            onClick={() => enter(picked.role, picked.employeeId)}
          >
            {step === "mfa" ? "Verify and continue" : `Continue as ${person.preferredName}`}
          </Button>
          <button className="mt-3 text-center text-[11px] text-white/50" onClick={() => reset()}>
            Reset demo data
          </button>
        </motion.div>

        <div className="relative hidden md:block">
          <InView delay={0.15}>
            <div className="rounded-[28px] bg-white p-6 shadow-[0_24px_70px_rgba(45,64,180,0.12)]">
              <div className="mb-5 flex items-center justify-between">
                <p className="font-semibold">Home</p>
                <span className="text-xs text-muted">27 Oct 2026</span>
              </div>
              <div className="grid grid-cols-4 gap-3">
                {[
                  { label: "On roll", value: "1,588", bg: "bg-[#e7f8ef]", c: "text-[#0f9f6e]" },
                  { label: "On leave", value: "42", bg: "bg-[#fff1e6]", c: "text-[#e07a3d]" },
                  { label: "Contract in plant", value: "186", bg: "bg-[#eeeaff]", c: "text-[#5b5bd6]" },
                  { label: "Open gates", value: "4", bg: "bg-[#fdeef4]", c: "text-[#d4537e]" },
                ].map((k) => (
                  <div key={k.label} className={`rounded-2xl ${k.bg} p-3`}>
                    <p className="text-[11px] text-muted">{k.label}</p>
                    <p className={`mt-2 text-2xl font-semibold ${k.c}`}>{k.value}</p>
                  </div>
                ))}
              </div>
              <div className="mt-5 grid grid-cols-3 gap-3">
                {EMPLOYEES.slice(0, 6).map((e) => (
                  <div key={e.id} className="rounded-2xl bg-[#f6f8fd] p-3">
                    <Avatar name={e.name} size={48} />
                    <p className="mt-2 truncate text-sm font-semibold">{e.preferredName}</p>
                    <p className="truncate text-[11px] text-muted">{e.grade}</p>
                  </div>
                ))}
              </div>
            </div>
          </InView>
          <motion.div
            initial={reduce ? false : { opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, duration: 0.55 }}
            className="absolute -left-10 bottom-10 w-56 rounded-2xl bg-white p-4 shadow-[0_18px_40px_rgba(45,64,180,0.16)]"
          >
            <p className="text-xs text-muted">October payroll</p>
            <p className="mt-1 text-lg font-semibold">Inputs open</p>
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-brand-soft">
              <div className="h-full w-2/5 bg-brand" />
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

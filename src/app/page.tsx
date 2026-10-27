"use client";

import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { InView } from "@/components/motion/in-view";
import { needsMfa, resolveDirectory, verifyMfa } from "@/lib/auth";
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
  const [user, setUser] = useState("");
  const [password, setPassword] = useState("");
  const [mfa, setMfa] = useState("");
  const [pending, setPending] = useState<{ id: string; role: Role } | null>(null);

  useEffect(() => {
    if (hydrated && userId) router.replace("/home");
  }, [hydrated, userId, router]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!pending) {
      const r = resolveDirectory(user, password);
      if (!r.ok) {
        toast.error(r.reason);
        return;
      }
      if (needsMfa(r.role)) {
        setPending({ id: r.id, role: r.role });
        return;
      }
      login(r.id, r.role);
      router.push(r.role === "gate_security" ? "/gate" : "/home");
      return;
    }
    if (!verifyMfa(mfa)) {
      toast.error("Authenticator code is incorrect.");
      return;
    }
    login(pending.id, pending.role);
    router.push(pending.role === "gate_security" ? "/gate" : "/home");
  }

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
              <p className="text-sm font-semibold tracking-tight">NRL People</p>
              <p className="text-xs text-white/70">Numaligarh Refinery Limited</p>
            </div>
          </div>
          <h1 className="max-w-sm text-[34px] font-semibold leading-[1.1] tracking-tight">
            Your work, pay and crew. One place.
          </h1>
          <p className="mt-3 max-w-md text-sm leading-6 text-white/80">
            DPE pay, workmen settlement, gate passes and statutory files — one system for the refinery.
          </p>
          <div className="mt-8 hidden flex-1 md:grid">
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "On roll", value: "1,588" },
                { label: "Locations", value: "4" },
                { label: "Contract in plant", value: "186" },
                { label: "October payroll", value: "Open" },
              ].map((k) => (
                <div key={k.label} className="rounded-2xl bg-white/10 p-4">
                  <p className="text-[11px] text-white/60">{k.label}</p>
                  <p className="mt-2 text-2xl font-semibold">{k.value}</p>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        <InView delay={0.12}>
          <form
            onSubmit={submit}
            className="rounded-[28px] bg-white p-7 shadow-[0_24px_70px_rgba(45,64,180,0.12)] md:p-8"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">NRL directory</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight">
              {pending ? "Authenticator" : "Sign in"}
            </h2>
            <p className="mt-1 text-sm text-muted">
              {pending
                ? "Enter the six-digit code from your authenticator app."
                : "Use your employee number or nrl.co.in email."}
            </p>
            {!pending ? (
              <div className="mt-6 grid gap-4">
                <Field label="Employee number or email">
                  <Input
                    autoComplete="username"
                    value={user}
                    onChange={(e) => setUser(e.target.value)}
                    placeholder="NRL/E/2014/142"
                  />
                </Field>
                <Field label="Password">
                  <Input
                    type="password"
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </Field>
              </div>
            ) : (
              <div className="mt-6">
                <Field label="Authentication code">
                  <Input
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    value={mfa}
                    onChange={(e) => setMfa(e.target.value)}
                    className="tracking-[0.4em]"
                    autoFocus
                  />
                </Field>
                <button type="button" className="mt-3 text-xs font-semibold text-brand" onClick={() => setPending(null)}>
                  Back
                </button>
              </div>
            )}
            <Button className="mt-6 h-12 w-full" type="submit">
              {pending ? "Verify and continue" : "Sign in"}
            </Button>
            <p className="mt-4 text-center text-[11px] text-muted">Forgot password? IT helpdesk · 03774-265000</p>
          </form>
        </InView>
      </div>
    </div>
  );
}

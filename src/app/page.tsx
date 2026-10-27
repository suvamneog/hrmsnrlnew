"use client";

import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { needsMfa, resolveDirectory, verifyMfa } from "@/lib/auth";
import { useHrms } from "@/lib/store";
import type { Role } from "@/lib/types";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export default function LoginPage() {
  const login = useHrms((s) => s.login);
  const userId = useHrms((s) => s.currentUserId);
  const hydrated = useHrms((s) => s.hydrated);
  const router = useRouter();
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
    <div className="relative grid min-h-[100dvh] place-items-center overflow-x-hidden bg-[#edf1fb] px-5 py-10">
      <div className="pointer-events-none absolute -left-24 -top-24 h-80 w-80 rounded-full bg-[#c9d4ff] blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 right-0 h-96 w-96 rounded-full bg-[#d7c9ff] blur-3xl" />
      <form
        onSubmit={submit}
        className="relative w-full max-w-[420px] rounded-[28px] bg-white p-7 shadow-[0_24px_70px_rgba(45,64,180,0.12)] md:p-8"
      >
        <div className="mb-6 flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-2xl bg-[#3d5afe] text-lg font-bold text-white">N</span>
          <div>
            <p className="text-sm font-semibold tracking-tight">NRL People</p>
            <p className="text-xs text-muted">Numaligarh Refinery Limited</p>
          </div>
        </div>
        <h1 className="text-2xl font-semibold tracking-tight">{pending ? "Authenticator" : "Sign in"}</h1>
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
    </div>
  );
}

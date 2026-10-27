"use client";

import { LoginScene } from "@/components/login/login-scene";
import { needsMfa, resolveDirectory, verifyMfa } from "@/lib/auth";
import { useHrms } from "@/lib/store";
import type { Role } from "@/lib/types";
import { ArrowRight, LockSimple, ShieldCheck, User } from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

const field =
  "w-full bg-transparent text-[15px] text-white outline-none placeholder:text-white/75 [&:-webkit-autofill]:shadow-[inset_0_0_0_1000px_#3d5afe] [&:-webkit-autofill]:[-webkit-text-fill-color:#fff]";

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
    <div className="flex min-h-[100dvh] bg-[#3d5afe]">
      <form
        onSubmit={submit}
        className="flex w-full shrink-0 flex-col justify-center px-10 py-12 text-white sm:px-12 md:w-[min(32vw,380px)] md:px-14"
      >
        <h1 className="text-[34px] font-semibold leading-none tracking-tight">{pending ? "Authenticator" : "Login"}</h1>
        <span className="mt-3 mb-11 block h-[3px] w-[52px] bg-white" />

        {!pending ? (
          <div className="grid gap-8">
            <label className="flex items-center gap-3 border-b border-white/50 pb-3">
              <User size={16} weight="fill" className="shrink-0" />
              <input
                autoComplete="username"
                value={user}
                onChange={(e) => setUser(e.target.value)}
                placeholder="User Name"
                className={field}
              />
            </label>
            <label className="flex items-center gap-3 border-b border-white/50 pb-3">
              <LockSimple size={16} weight="fill" className="shrink-0" />
              <input
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                className={field}
              />
            </label>
          </div>
        ) : (
          <div>
            <label className="flex items-center gap-3 border-b border-white/50 pb-3">
              <ShieldCheck size={18} weight="bold" className="shrink-0" />
              <input
                inputMode="numeric"
                autoComplete="one-time-code"
                value={mfa}
                onChange={(e) => setMfa(e.target.value)}
                placeholder="Authentication code"
                className={`${field} tracking-[0.35em]`}
                autoFocus
              />
            </label>
            <button type="button" className="mt-4 text-sm font-semibold text-white/80 hover:text-white" onClick={() => setPending(null)}>
              Back
            </button>
          </div>
        )}

        <button
          type="submit"
          className="mx-auto mt-12 inline-flex h-11 items-center justify-center gap-2 rounded-full bg-white px-10 text-[12px] font-bold tracking-[0.18em] text-[#3d5afe] transition hover:bg-white/95 active:scale-[0.98]"
        >
          {pending ? "VERIFY" : "LOGIN"}
          <ArrowRight size={16} weight="bold" />
        </button>
        <p className="mt-10 text-center text-[11px] text-white/65">IT helpdesk · 03774-265000</p>
      </form>

      <div className="hidden min-h-[100dvh] flex-1 p-4 pl-2 pr-5 py-5 md:block">
        <div className="relative h-full overflow-hidden rounded-[28px] bg-[#f5f7fb]">
          <div className="absolute right-8 top-7 z-10 flex items-center gap-2.5">
            <svg width="28" height="28" viewBox="0 0 32 32" aria-hidden>
              <g fill="#3d5afe" transform="rotate(-38 16 16)">
                <rect x="3" y="4" width="5" height="24" rx="2.5" />
                <rect x="10" y="4" width="5" height="24" rx="2.5" />
                <rect x="17" y="4" width="5" height="24" rx="2.5" />
                <rect x="24" y="4" width="5" height="24" rx="2.5" />
              </g>
            </svg>
            <span className="text-[18px] font-semibold tracking-tight text-[#1b2140]">NRL People</span>
          </div>
          <LoginScene />
        </div>
      </div>
    </div>
  );
}

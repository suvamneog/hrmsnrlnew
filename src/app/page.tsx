"use client";

import { landingFor } from "@/lib/access";
import { LoginScene } from "@/components/login/login-scene";
import { needsMfa, resolveDirectory, verifyMfa } from "@/lib/auth";
import { useHrms } from "@/lib/store";
import type { Role } from "@/lib/types";
import { CaretRight, LockSimple, ShieldCheck, User } from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

const field =
  "w-full bg-transparent text-[12px] font-semibold text-white outline-none placeholder:font-semibold placeholder:text-white/90 [&:-webkit-autofill]:shadow-[inset_0_0_0_1000px_#3d5afe] [&:-webkit-autofill]:[-webkit-text-fill-color:#fff]";

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
    if (hydrated && userId) router.replace(landingFor(useHrms.getState().actingRole));
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
      router.push(landingFor(r.role));
      return;
    }
    if (!verifyMfa(mfa)) {
      toast.error("Authenticator code is incorrect.");
      return;
    }
    login(pending.id, pending.role);
    router.push(landingFor(pending.role));
  }

  return (
    <div className="flex min-h-[100dvh] bg-[#3d5afe]">
      <form
        onSubmit={submit}
        className="flex w-full shrink-0 flex-col justify-center px-10 py-12 text-white sm:px-12 md:w-[33vw] md:max-w-[420px] md:px-[4.4vw]"
      >
        <h1 className="text-[26px] font-bold leading-none tracking-tight">{pending ? "Authenticator" : "Login"}</h1>
        <span className="mt-3 mb-10 block h-[4px] w-[132px] rounded-full bg-white" />

        {!pending ? (
          <div className="grid gap-8">
            <label className="flex items-center gap-3 border-b border-white/60 pb-2.5">
              <User size={15} weight="fill" className="shrink-0" />
              <input
                autoComplete="username"
                value={user}
                onChange={(e) => setUser(e.target.value)}
                placeholder="User Name"
                className={field}
              />
            </label>
            <label className="flex items-center gap-3 border-b border-white/60 pb-2.5">
              <LockSimple size={15} weight="fill" className="shrink-0" />
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
            <label className="flex items-center gap-3 border-b border-white/60 pb-2.5">
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
          className="mx-auto mt-12 inline-flex h-[34px] w-[104px] items-center justify-center gap-2 rounded-full bg-white text-[10px] font-bold tracking-[0.08em] shadow-[0_6px_16px_rgba(20,30,90,0.18)] text-[#3d5afe] transition hover:bg-white/95 active:scale-[0.98]"
        >
          {pending ? "VERIFY" : "LOGIN"}
          <CaretRight size={11} weight="bold" />
        </button>
      </form>

      <div className="hidden min-h-[100dvh] flex-1 pt-1 md:block">
        <div className="relative h-full overflow-hidden rounded-l-[28px] bg-[#f5f7fb]">
          <div className="absolute right-8 top-7 z-10 flex items-center gap-2.5">
            <svg width="28" height="28" viewBox="0 0 32 32" aria-hidden>
              <g fill="#3d5afe" transform="rotate(-38 16 16)">
                <rect x="3" y="4" width="5" height="24" rx="2.5" />
                <rect x="10" y="4" width="5" height="24" rx="2.5" />
                <rect x="17" y="4" width="5" height="24" rx="2.5" />
                <rect x="24" y="4" width="5" height="24" rx="2.5" />
              </g>
            </svg>
            <span className="text-[22px] font-normal tracking-tight text-[#1b2140]">NRL <b className="font-bold">People</b></span>
          </div>
          <LoginScene />
        </div>
      </div>
    </div>
  );
}

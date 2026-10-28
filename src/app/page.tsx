"use client";

import { landingFor } from "@/lib/access";
import { LanguageSwitch } from "@/components/i18n/language-switch";
import Link from "next/link";
import Image from "next/image";
import { needsMfa, resolveDirectory, verifyMfa } from "@/lib/auth";
import { useHrms } from "@/lib/store";
import type { Role } from "@/lib/types";
import { ArrowRight, LockSimple, ShieldCheck, User } from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

const field =
  "w-full min-w-0 bg-transparent text-[20px] font-semibold text-white outline-none placeholder:font-semibold placeholder:text-white [&:-webkit-autofill]:shadow-[inset_0_0_0_1000px_#3d5afe] [&:-webkit-autofill]:[-webkit-text-fill-color:#fff]";

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

  // One layout for every screen: the crew picture in a white card on top, the login below it.
  // On wide screens the column is centred on the blue page rather than stretched.
  return (
    <div className="min-h-[100dvh] bg-[#3d5afe] md:grid md:place-items-center md:py-6">
      <div className="mx-auto flex min-h-[100dvh] w-full max-w-[520px] flex-col md:min-h-0 md:overflow-hidden md:rounded-[28px] md:shadow-[0_24px_60px_rgba(20,30,90,0.25)]">
        <div className="relative rounded-b-[24px] bg-white px-4 pt-5 pb-2 md:rounded-b-[24px] md:px-6 md:pt-6">
          <div className="flex justify-end">
            <span className="flex items-center gap-2 text-[#3d5afe]">
              <svg width="26" height="26" viewBox="0 0 32 32" aria-hidden>
                <g fill="currentColor" transform="rotate(-38 16 16)">
                  <rect x="3" y="4" width="5" height="24" rx="2.5" />
                  <rect x="10" y="4" width="5" height="24" rx="2.5" />
                  <rect x="17" y="4" width="5" height="24" rx="2.5" />
                  <rect x="24" y="4" width="5" height="24" rx="2.5" />
                </g>
              </svg>
              <span className="text-[20px] font-semibold tracking-tight">NRL People</span>
            </span>
          </div>
          <Image
            src="/login-scene.jpg"
            alt="NRL plant staff in front of the refinery"
            width={2400}
            height={1600}
            priority
            sizes="(min-width: 768px) 520px, 100vw"
            className="mx-auto mt-2 h-auto w-full select-none md:max-h-[32vh] md:w-auto"
          />
        </div>

        <form onSubmit={submit} className="flex flex-1 flex-col px-7 pt-9 pb-10 text-white sm:px-10 md:pt-7 md:pb-8">
          <h1 className="text-[48px] font-bold leading-none tracking-tight sm:text-[56px]">{pending ? "Verify" : "Login"}</h1>
          <span className="mt-4 mb-10 block h-[5px] w-[96px] rounded-full bg-white md:mb-8" />

          {!pending ? (
            <div className="grid gap-8">
              <label className="flex items-center gap-4">
                <User size={26} className="shrink-0" />
                <span className="flex-1 border-b border-white/80 pb-2.5">
                  <input autoComplete="username" value={user} onChange={(e) => setUser(e.target.value)} placeholder="User Name" className={field} />
                </span>
              </label>
              <label className="flex items-center gap-4">
                <LockSimple size={26} className="shrink-0" />
                <span className="flex-1 border-b border-white/80 pb-2.5">
                  <input
                    type="password"
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Password"
                    className={field}
                  />
                </span>
              </label>
            </div>
          ) : (
            <div>
              <label className="flex items-center gap-4">
                <ShieldCheck size={26} className="shrink-0" />
                <span className="flex-1 border-b border-white/80 pb-2.5">
                  <input
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    value={mfa}
                    onChange={(e) => setMfa(e.target.value)}
                    placeholder="Authentication code"
                    className={`${field} tracking-[0.3em]`}
                    autoFocus
                  />
                </span>
              </label>
              <button type="button" className="mt-4 text-sm font-semibold text-white/80 hover:text-white" onClick={() => setPending(null)}>
                Back
              </button>
            </div>
          )}

          <button
            type="submit"
            className="mx-auto mt-10 inline-flex h-14 md:mt-8 items-center justify-center gap-2 rounded-full bg-white px-12 text-[20px] font-bold tracking-[0.02em] text-[#1e2fb8] shadow-[0_6px_16px_rgba(20,30,90,0.18)] transition hover:bg-white/95 active:scale-[0.98]"
          >
            {pending ? "VERIFY" : "LOGIN"}
            <ArrowRight size={20} weight="bold" />
          </button>

          <div className="mt-9 flex flex-col items-center gap-5 md:mt-7 md:gap-4">
            <LanguageSwitch onDark names="english" className="border border-white/70 bg-transparent" />
            <Link href="/kiosk" className="text-[17px] font-semibold text-white underline underline-offset-4">
              Open kiosk
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}

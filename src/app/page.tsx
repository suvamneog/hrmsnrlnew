"use client";

import { landingFor } from "@/lib/access";
import { LanguageSwitch } from "@/components/i18n/language-switch";
import Link from "next/link";
import Image from "next/image";
import { needsMfa, resolveDirectory, verifyMfa } from "@/lib/auth";
import { useHrms } from "@/lib/store";
import type { Role } from "@/lib/types";
import { CaretRight, LockSimple, ShieldCheck, User } from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

const field =
  "w-full bg-transparent text-[17px] font-semibold text-white outline-none placeholder:font-semibold placeholder:text-white/90 [&:-webkit-autofill]:shadow-[inset_0_0_0_1000px_#3d5afe] [&:-webkit-autofill]:[-webkit-text-fill-color:#fff]";

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
        className="flex w-full shrink-0 flex-col justify-center px-10 py-12 text-white sm:px-14 md:w-[38vw] md:max-w-[560px] md:px-[5vw]"
      >
        <h1 className="text-[40px] font-bold leading-none tracking-tight">{pending ? "Authenticator" : "Login"}</h1>
        <span className="mt-4 mb-12 block h-[5px] w-[160px] rounded-full bg-white" />

        {!pending ? (
          <div className="grid gap-10">
            <label className="flex items-center gap-3 border-b border-white/60 pb-3.5">
              <User size={20} weight="fill" className="shrink-0" />
              <input
                autoComplete="username"
                value={user}
                onChange={(e) => setUser(e.target.value)}
                placeholder="User Name"
                className={field}
              />
            </label>
            <label className="flex items-center gap-3 border-b border-white/60 pb-3.5">
              <LockSimple size={20} weight="fill" className="shrink-0" />
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
            <label className="flex items-center gap-3 border-b border-white/60 pb-3.5">
              <ShieldCheck size={22} weight="bold" className="shrink-0" />
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
          className="mx-auto mt-14 inline-flex h-[52px] w-[168px] items-center justify-center gap-2 rounded-full bg-white text-[15px] font-bold tracking-[0.06em] shadow-[0_6px_16px_rgba(20,30,90,0.18)] text-[#3d5afe] transition hover:bg-white/95 active:scale-[0.98]"
        >
          {pending ? "VERIFY" : "LOGIN"}
          <CaretRight size={15} weight="bold" />
        </button>

        <div className="mt-14 flex flex-wrap items-center justify-center gap-4">
          <LanguageSwitch onDark large />
          <Link href="/kiosk" className="text-base font-semibold text-white/85 underline-offset-4 hover:text-white hover:underline">
            Open kiosk
          </Link>
        </div>
      </form>

      <div className="hidden min-h-[100dvh] flex-1 pt-1 md:block">
        <div className="relative h-full overflow-hidden rounded-l-[28px] bg-white">
          <div className="absolute right-8 top-7 z-10 flex items-center gap-2.5 rounded-full bg-white/80 px-4 py-2 backdrop-blur">
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
          {/* Refinery crew fills the panel, kept to the bottom edge so the ground line meets the page. */}
          <Image
            src="/login-scene.jpg"
            alt="NRL plant staff in front of the refinery"
            fill
            priority
            sizes="70vw"
            className="select-none object-contain object-bottom"
          />
        </div>
      </div>
    </div>
  );
}

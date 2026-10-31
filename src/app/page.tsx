"use client";

import { landingFor } from "@/lib/access";
import { LanguageSwitch } from "@/components/i18n/language-switch";
import Link from "next/link";
import Image from "next/image";
import { needsMfa, resolveDirectory, verifyMfa } from "@/lib/auth";
import { useHrms } from "@/lib/store";
import type { Role } from "@/lib/types";
import {
  ArrowRight,
  CaretRight,
  LockSimple,
  ShieldCheck,
  User,
} from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

// Desktop fields, as in the side-by-side layout.
const fieldDesk =
  "w-full min-w-0 bg-transparent text-[15px] font-semibold text-white outline-none md:text-[17px] placeholder:font-semibold placeholder:text-white/90 [&:-webkit-autofill]:shadow-[inset_0_0_0_1000px_#3d5afe] [&:-webkit-autofill]:[-webkit-text-fill-color:#fff]";

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
  const [pending, setPending] = useState<{ id: string; role: Role } | null>(
    null,
  );

  useEffect(() => {
    if (hydrated && userId)
      router.replace(landingFor(useHrms.getState().actingRole));
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
  // Phones and tablets: picture card on top, login below. Desktop (1024px and up): form on the
  // left and the full scene on the right. Both share the same state; only one is ever visible.
  return (
    <>
      <div className="min-h-[100dvh] bg-[#3d5afe] md:grid md:place-items-center md:py-6 lg:hidden">
        <div className="mx-auto flex min-h-[100dvh] w-full max-w-[520px] flex-col md:min-h-0 md:overflow-hidden md:rounded-xl md:shadow-[0_24px_24px_rgba(20,30,90,0.25)]">
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
                <span className="text-[20px] font-semibold tracking-tight">
                  NRL People
                </span>
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

          <form
            onSubmit={submit}
            className="flex flex-1 flex-col px-7 pt-9 pb-10 text-white sm:px-10 md:pt-7 md:pb-8"
          >
            <h1 className="text-[48px] font-bold leading-none tracking-tight sm:text-[56px]">
              {pending ? "Verify" : "Login"}
            </h1>
            <span className="mt-4 mb-10 block h-[5px] w-[96px] rounded-full bg-white md:mb-8" />

            {!pending ? (
              <div className="grid gap-8">
                <label className="flex items-center gap-4">
                  <User size={26} className="shrink-0" />
                  <span className="flex-1 border-b border-white/80 pb-2.5">
                    <input
                      autoComplete="username"
                      value={user}
                      onChange={(e) => setUser(e.target.value)}
                      placeholder="User Name"
                      className={field}
                    />
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
                      placeholder="6-digit code"
                      maxLength={6}
                      className={`${field} placeholder:tracking-normal tracking-[0.3em]`}
                      autoFocus
                    />
                  </span>
                </label>
                <p className="mt-3 text-sm text-white/80">Open your authenticator app and enter the 6-digit code shown for NRL People.</p>
                <button
                  type="button"
                  className="mt-4 text-sm font-semibold text-white/80 hover:text-white"
                  onClick={() => setPending(null)}
                >
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
              <LanguageSwitch
                onDark
                names="english"
                className="border border-white/70 bg-transparent"
              />
              <Link
                href="/kiosk"
                className="text-[17px] font-semibold text-white underline underline-offset-4"
              >
                Open kiosk
              </Link>
            </div>
          </form>
        </div>
      </div>
      <div className="hidden min-h-[100dvh] bg-[#3d5afe] lg:flex">
        <form
          onSubmit={submit}
          className="flex w-[56%] min-w-0 shrink-0 flex-col justify-center px-5 py-10 text-white sm:w-[48%] sm:px-10 md:w-[38vw] md:max-w-[560px] md:px-[5vw]"
        >
          <h1 className="text-[26px] font-bold leading-none tracking-tight sm:text-[32px] md:text-[40px]">
            {pending ? "Authenticator" : "Login"}
          </h1>
          <span className="mt-3 mb-8 block h-[4px] w-[96px] rounded-full bg-white sm:mb-10 md:mt-4 md:mb-12 md:h-[5px] md:w-[160px]" />

          {!pending ? (
            <div className="grid gap-7 md:gap-10">
              <label className="flex items-center gap-3 border-b border-white/60 pb-3.5">
                <User size={20} weight="fill" className="shrink-0" />
                <input
                  autoComplete="username"
                  value={user}
                  onChange={(e) => setUser(e.target.value)}
                  placeholder="User Name"
                  className={fieldDesk}
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
                  className={fieldDesk}
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
                  placeholder="6-digit code"
                  maxLength={6}
                  className={`${fieldDesk} placeholder:tracking-normal tracking-[0.35em]`}
                  autoFocus
                />
              </label>
              <p className="mt-3 text-[13px] text-white/80">Open your authenticator app and enter the 6-digit code shown for NRL People.</p>
              <button
                type="button"
                className="mt-4 text-sm font-semibold text-white/80 hover:text-white"
                onClick={() => setPending(null)}
              >
                Back
              </button>
            </div>
          )}

          <button
            type="submit"
            className="mx-auto mt-10 inline-flex h-11 w-[132px] items-center justify-center gap-2 rounded-full bg-white text-[13px] font-bold tracking-[0.06em] md:mt-14 md:h-[52px] md:w-[168px] md:text-[15px] shadow-[0_6px_16px_rgba(20,30,90,0.18)] text-[#3d5afe] transition hover:bg-white/95 active:scale-[0.98]"
          >
            {pending ? "VERIFY" : "LOGIN"}
            <CaretRight size={15} weight="bold" />
          </button>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-3 md:mt-14 md:gap-4">
            <LanguageSwitch onDark className="md:hidden" />
            <LanguageSwitch onDark large className="hidden md:inline-flex" />
            <Link
              href="/kiosk"
              className="text-sm font-semibold md:text-base text-white/85 underline-offset-4 hover:text-white hover:underline"
            >
              Open kiosk
            </Link>
          </div>
        </form>

        <div className="min-h-[100dvh] min-w-0 flex-1 pt-1">
          <div className="relative h-full overflow-hidden rounded-l-[20px] bg-white md:rounded-l-[28px]">
            <div className="absolute right-3 top-4 z-10 flex items-center gap-2.5 rounded-full bg-white/80 px-2.5 py-1.5 backdrop-blur md:right-8 md:top-7 md:px-4 md:py-2">
              <svg
                width="24"
                height="24"
                viewBox="0 0 32 32"
                aria-hidden
                className="md:h-7 md:w-7"
              >
                <g fill="#3d5afe" transform="rotate(-38 16 16)">
                  <rect x="3" y="4" width="5" height="24" rx="2.5" />
                  <rect x="10" y="4" width="5" height="24" rx="2.5" />
                  <rect x="17" y="4" width="5" height="24" rx="2.5" />
                  <rect x="24" y="4" width="5" height="24" rx="2.5" />
                </g>
              </svg>
              <span className="hidden text-[22px] font-normal tracking-tight text-[#1b2140] sm:inline">
                NRL <b className="font-bold">People</b>
              </span>
            </div>
            {/* The whole scene shows at every width, anchored to the bottom like the desktop view. */}
            <Image
              src="/login-scene.jpg"
              alt="NRL plant staff in front of the refinery"
              fill
              priority
              sizes="(min-width: 768px) 62vw, 44vw"
              className="select-none object-contain object-bottom"
            />
          </div>
        </div>
      </div>
    </>
  );
}

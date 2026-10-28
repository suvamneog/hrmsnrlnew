"use client";

import { AccountChip } from "@/components/layout/account-chip";
import { ArrowCounterClockwise, Bell, MagnifyingGlass, SignOut } from "@phosphor-icons/react";
import { useDesk } from "@/lib/desk";
import { LanguageSwitch } from "@/components/i18n/language-switch";
import { MobileNav } from "@/components/layout/mobile-nav";
import { locationName, unitName } from "@/lib/org";
import { toast } from "sonner";
import { commandHits } from "@/lib/search";
import { useCurrentUser, useHrms } from "@/lib/store";
import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

export function Topbar() {
  const user = useCurrentUser();
  const role = useHrms((s) => s.actingRole);
  const employees = useHrms((s) => s.employees);
  const contractors = useHrms((s) => s.contractors);
  const workers = useHrms((s) => s.workers);
  const balances = useHrms((s) => s.leaveBalances);
  const types = useHrms((s) => s.leaveTypes);
  const notes = useHrms((s) => s.notifications);
  const logout = useHrms((s) => s.logout);
  const resetDemo = useHrms((s) => s.resetDemo);
  const resetDesk = useDesk((s) => s.resetDesk);
  const cases = useDesk((s) => s.cases);
  const permits = useDesk((s) => s.permits);
  const incidents = useDesk((s) => s.incidents);
  const visitors = useDesk((s) => s.visitors);
  const [confirmReset, setConfirmReset] = useState(false);
  const markRead = useHrms((s) => s.markRead);
  const router = useRouter();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const mine = notes.filter((n) => n.userId === user?.id && !n.read);

  const hits = useMemo(
    () =>
      commandHits({
        q,
        role,
        employees,
        contractors,
        workers,
        balances,
        types,
        meId: user?.id ?? null,
        desk: { cases, permits, incidents, visitors },
      }),
    [q, role, employees, contractors, workers, balances, types, user?.id, cases, permits, incidents, visitors],
  );

  if (!user || !role) return null;

  return (
    <header className="relative flex h-16 items-center gap-2 px-3 md:gap-3 md:px-7">
      <MobileNav />
      {/* Where this person works, always in view: unit, crew and site. */}
      <div className="hidden shrink-0 border-r border-line pr-4 lg:block">
        <p className="text-[13px] font-medium text-ink">{unitName(user.unitId)}</p>
        <p className="text-[12px] text-muted">{[user.crew ? `Crew ${user.crew}` : null, locationName(user.locationId)].filter(Boolean).join(", ")}</p>
      </div>
      <div className="relative hidden min-w-0 flex-1 md:block">
        <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={18} />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Leave balance, payslip, people…"
          className="h-11 w-full rounded-full border border-line bg-white pl-10 pr-4 text-sm outline-none focus:border-brand focus:ring-4 focus:ring-brand/10"
        />
        {hits.length > 0 && (
          <div className="absolute z-30 mt-2 w-full overflow-hidden rounded-xl bg-white py-2 shadow-[0_8px_24px_rgba(0,0,0,0.08)]">
            {hits.map((h) => (
              <Link
                key={h.href + h.label}
                href={h.href}
                onClick={() => setQ("")}
                className="flex items-center justify-between px-4 py-2 text-sm hover:bg-brand-soft"
              >
                <span>{h.label}</span>
                <span className="text-xs text-muted">{h.meta}</span>
              </Link>
            ))}
          </div>
        )}
      </div>
      <button
        className="relative ml-auto grid h-11 w-11 shrink-0 place-items-center rounded-full bg-white text-ink md:ml-0"
        onClick={() => setOpen((v) => !v)}
        aria-label="Notifications"
      >
        <Bell size={18} weight="duotone" />
        {mine.length > 0 && <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-danger" />}
      </button>
      <LanguageSwitch className="hidden sm:inline-flex" />
      <button
        type="button"
        onClick={() => {
          if (!confirmReset) {
            setConfirmReset(true);
            setTimeout(() => setConfirmReset(false), 3000);
            return;
          }
          resetDemo();
          resetDesk();
          setConfirmReset(false);
          toast.success("Demo data reset");
        }}
        className={`hidden h-11 shrink-0 items-center gap-2 rounded-lg px-4 text-[13px] font-semibold transition-colors md:inline-flex ${confirmReset ? "bg-danger-soft text-danger" : "bg-white text-muted hover:text-ink"}`}
        aria-label="Reset demo data"
      >
        <ArrowCounterClockwise size={16} />
        {confirmReset ? "Tap again to reset" : "Reset demo"}
      </button>
      <div className="min-w-0">
        <AccountChip />
      </div>
      <button
        onClick={() => {
          logout();
          router.push("/");
        }}
        className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-white text-muted hover:text-ink"
        aria-label="Sign out"
      >
        <SignOut size={18} />
      </button>
      {open && (
        <div className="absolute inset-x-3 top-16 z-40 rounded-xl sm:left-auto sm:right-20 sm:w-80 bg-white p-3 shadow-[0_8px_24px_rgba(0,0,0,0.08)]">
          <p className="px-2 pb-2 text-xs font-semibold text-muted">Inbox</p>
          {notes.filter((n) => n.userId === user.id).length === 0 && (
            <p className="px-2 py-6 text-sm text-muted">No new notifications.</p>
          )}
          {notes
            .filter((n) => n.userId === user.id)
            .slice(0, 5)
            .map((n) => (
              <Link
                key={n.id}
                href={n.href}
                onClick={() => {
                  markRead(n.id);
                  setOpen(false);
                }}
                className="block rounded-xl px-3 py-2 hover:bg-brand-soft"
              >
                <p className="text-sm font-semibold">{n.title}</p>
                <p className="text-xs text-muted">{n.body}</p>
              </Link>
            ))}
        </div>
      )}
    </header>
  );
}

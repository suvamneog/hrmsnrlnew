"use client";

import { AccountChip } from "@/components/layout/account-chip";
import { ArrowCounterClockwise, Bell, MagnifyingGlass, SignOut } from "@phosphor-icons/react";
import { useDesk } from "@/lib/desk";
import { LanguageSwitch } from "@/components/i18n/language-switch";
import { MobileNav } from "@/components/layout/mobile-nav";
import { locationName, unitName } from "@/lib/org";
import { withUndo } from "@/lib/undo";
import { commandHits } from "@/lib/search";
import { useCurrentUser, useHrms } from "@/lib/store";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
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
  const markRead = useHrms((s) => s.markRead);
  const router = useRouter();
  const [q, setQ] = useState("");
  const [active, setActive] = useState(0);
  const search = useRef<HTMLInputElement>(null);
  const mac = useSyncExternalStore(() => () => {}, () => /Mac|iPhone|iPad/.test(navigator.platform), () => true);
  // Cmd+K (Ctrl+K elsewhere) jumps to search from anywhere; it never fires while typing in another field.
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() !== "k" || !(e.metaKey || e.ctrlKey)) return;
      const t = e.target as HTMLElement;
      if (t !== search.current && (t.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(t.tagName))) return;
      e.preventDefault();
      search.current?.focus();
      search.current?.select();
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, []);
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
          ref={search}
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setActive(0);
          }}
          onKeyDown={(e) => {
            // Arrow keys move through results and Enter opens one, so search works without a mouse.
            if (e.key === "ArrowDown") { e.preventDefault(); setActive((i) => Math.min(i + 1, hits.length - 1)); }
            else if (e.key === "ArrowUp") { e.preventDefault(); setActive((i) => Math.max(i - 1, 0)); }
            else if (e.key === "Enter" && hits[active]) { router.push(hits[active].href); setQ(""); search.current?.blur(); }
            else if (e.key === "Escape") { setQ(""); search.current?.blur(); }
          }}
          aria-label="Search pages and actions"
          aria-keyshortcuts={mac ? "Meta+K" : "Control+K"}
          placeholder="Leave balance, payslip, people…"
          className="h-11 w-full rounded-full border border-line bg-white pl-10 pr-16 text-sm outline-none focus:border-brand focus:ring-4 focus:ring-brand/10"
        />
        {!q && (
          <kbd className="pointer-events-none absolute right-3 hidden xl:block top-1/2 -translate-y-1/2 rounded-lg border border-line bg-subtle px-1.5 py-0.5 font-sans text-[12px] font-medium text-muted">
            {mac ? "⌘K" : "Ctrl K"}
          </kbd>
        )}
        {hits.length > 0 && (
          <div className="absolute z-30 mt-2 w-full overflow-hidden rounded-xl bg-white py-2 shadow-[0_8px_24px_rgba(0,0,0,0.08)]">
            {hits.map((h, i) => (
              <Link
                key={h.href + h.label}
                href={h.href}
                onClick={() => setQ("")}
                onMouseEnter={() => setActive(i)}
                className={`flex items-center justify-between px-4 py-2 text-sm ${i === active ? "bg-brand-soft" : ""}`}
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
        onClick={() => withUndo("Demo data reset", () => {
          resetDemo();
          resetDesk();
        })}
        className="hidden h-11 shrink-0 items-center gap-2 rounded-lg bg-white px-4 text-[13px] font-semibold text-muted transition-colors hover:text-ink md:inline-flex"
        aria-label="Reset demo data"
      >
        <ArrowCounterClockwise size={16} />
        Reset demo
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

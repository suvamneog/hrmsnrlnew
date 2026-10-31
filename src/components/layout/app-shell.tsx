"use client";

import { AccountChip } from "./account-chip";
import { LanguageSwitch } from "@/components/i18n/language-switch";
import { GlassTabBar } from "./glass-tab-bar";
import { Guard } from "./guard";
import { SectionTabs } from "./section-tabs";
import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";
import { GATE_PAGES, landingFor, routeAllowed } from "@/lib/access";
import { useHrms } from "@/lib/store";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import Link from "next/link";
import { cn } from "@/lib/cn";
import type { NavItem } from "@/lib/nav";

const GATE_DESK = GATE_PAGES;
const GATE_TABS = [
  { href: "/gate", label: "Pass check" },
  { href: "/visitors", label: "Visitors and vehicles" },
  { href: "/gate/handover", label: "Handover" },
  { href: "/self", label: "Me" },
];

const ESS_TABS: NavItem[] = [
  { href: "/home", label: "Home", icon: "house", roles: "all" },
  { href: "/time", label: "Time", icon: "clock", roles: "all" },
  { href: "/leave", label: "Leave", icon: "swap", roles: "all" },
  { href: "/approvals", label: "Inbox", icon: "check", roles: "all" },
  { href: "/self", label: "Me", icon: "user", roles: "all" },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const userId = useHrms((s) => s.currentUserId);
  const role = useHrms((s) => s.actingRole);
  const hydrated = useHrms((s) => s.hydrated);
  const router = useRouter();
  const path = usePathname();

  useEffect(() => {
    if (hydrated && !userId) router.replace("/");
  }, [hydrated, userId, router]);

  useEffect(() => {
    if (role === "gate_security" && !GATE_DESK.includes(path)) router.replace("/gate");
    else if (role && role !== "gate_security" && !routeAllowed(path, role)) {
      router.replace(landingFor(role));
    }
  }, [role, path, router]);

  if (!hydrated || !userId) {
    return (
      <div className="grid min-h-[100dvh] place-items-center bg-bg text-muted">
        Loading NRL People
      </div>
    );
  }

  if (role === "gate_security") {
    if (!GATE_DESK.includes(path)) {
      return (
        <div className="grid min-h-[100dvh] place-items-center bg-bg text-muted">
          Opening gate
        </div>
      );
    }
    return (
      <div className="min-h-[100dvh] bg-[#e8edf8]">
        {/* On a phone the tabs take the first row and the language and account sit below. */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
          <nav className="inline-flex max-w-full overflow-x-auto rounded-full bg-white p-1 [scrollbar-width:none]">
            {GATE_TABS.map((t) => (
              <Link
                key={t.href}
                href={t.href}
                className={cn(
                  "rounded-lg px-3 py-1.5 text-sm font-semibold transition-colors sm:px-4",
                  path === t.href || (t.href === "/self" && !["/gate", "/visitors", "/gate/handover"].includes(path))
                    ? "bg-brand text-white"
                    : "text-muted hover:text-ink",
                )}
              >
                {t.label}
              </Link>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-2">
            <LanguageSwitch />
            <AccountChip />
          </div>
        </div>
        <div className={path === "/gate" || path === "/visitors" || path === "/gate/handover" ? "" : "mx-auto max-w-6xl px-4 pb-10"}>
          {!["/gate", "/visitors", "/gate/handover"].includes(path) && <SectionTabs />}
          <Guard>{children}</Guard>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[100dvh] bg-bg">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="sticky top-0 z-30 bg-bg">
          <Topbar />
        </div>
        <main className="flex-1 px-4 pb-28 md:px-7 lg:pb-8">
          <SectionTabs />
          <Guard>{children}</Guard>
        </main>
        <GlassTabBar items={ESS_TABS.filter((item) => routeAllowed(item.href, role))} path={path} />
      </div>
    </div>
  );
}

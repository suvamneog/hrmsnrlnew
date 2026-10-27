"use client";

import { Guard } from "./guard";
import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";
import { useHrms } from "@/lib/store";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import Link from "next/link";
import { NavIcon } from "@/components/icons";
import { cn } from "@/lib/cn";
import type { NavItem } from "@/lib/nav";

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
  const mobile =
    role === "gate_security"
      ? ESS_TABS.map((t) => (t.href === "/time" ? { ...t, href: "/gate", label: "Gate", icon: "gate" as const } : t))
      : ESS_TABS;

  useEffect(() => {
    if (hydrated && !userId) router.replace("/");
  }, [hydrated, userId, router]);

  if (!hydrated || !userId) {
    return (
      <div className="grid min-h-[100dvh] place-items-center bg-bg text-muted">
        Loading NRL People
      </div>
    );
  }

  return (
    <div className="flex min-h-[100dvh] bg-bg">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar />
        <main className="flex-1 px-4 pb-24 md:px-7 md:pb-8">
          <Guard>{children}</Guard>
        </main>
        <nav className="fixed inset-x-0 bottom-0 z-30 flex justify-around border-t border-line bg-white/95 px-2 py-2 backdrop-blur md:hidden">
          {mobile.map((item) => {
            const active = path === item.href || path.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "grid place-items-center gap-0.5 rounded-xl px-3 py-1 text-[10px]",
                  active ? "text-brand" : "text-muted",
                )}
              >
                <NavIcon name={item.icon} size={22} />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}

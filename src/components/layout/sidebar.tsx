"use client";

import { NavIcon } from "@/components/icons";
import { cn } from "@/lib/cn";
import { isActive, visibleNav } from "@/lib/nav";
import { useHrms } from "@/lib/store";
import { motion } from "motion/react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function Sidebar() {
  const role = useHrms((s) => s.actingRole);
  const items = visibleNav(role);
  const path = usePathname();

  return (
    <aside className="relative z-30 hidden w-[84px] shrink-0 md:block">
      <div className="group/nav sticky top-0 flex h-[100dvh] w-[84px] flex-col bg-[#3d5afe] py-5 text-white transition-[width] duration-200 ease-out hover:w-[232px] hover:shadow-[12px_0_40px_rgba(45,64,180,0.18)]">
        <Link href="/home" className="mb-6 ml-[18px] flex h-12 items-center gap-3 overflow-hidden">
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-white/15 text-lg font-bold tracking-tight">
            N
          </span>
          <span className="whitespace-nowrap text-sm font-semibold opacity-0 transition-opacity duration-150 group-hover/nav:opacity-100">
            NRL People
          </span>
        </Link>
        <nav className="flex flex-1 flex-col gap-1 overflow-y-auto overflow-x-hidden px-2 pb-4">
          {items.map((item) => {
            const active = isActive(item, path);
            return (
              <Link key={item.href} href={item.href} className="relative flex items-center">
                {active && (
                  <motion.span
                    layoutId="nav-pill"
                    className="absolute inset-0 rounded-2xl bg-white"
                    transition={{ type: "spring", stiffness: 380, damping: 32 }}
                  />
                )}
                <span
                  className={cn(
                    "relative z-10 flex h-11 w-full items-center gap-3 rounded-2xl px-[10px] transition-colors",
                    active ? "text-brand" : "text-white/90 hover:bg-white/10",
                  )}
                >
                  <span className="grid h-11 w-11 shrink-0 place-items-center">
                    <NavIcon name={item.icon} />
                  </span>
                  <span className="truncate text-sm font-semibold opacity-0 transition-opacity duration-150 group-hover/nav:opacity-100">
                    {item.label}
                  </span>
                </span>
              </Link>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}

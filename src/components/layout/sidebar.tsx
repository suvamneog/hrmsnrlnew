"use client";

import { Wordmark } from "@/components/brand/wordmark";
import { NavIcon } from "@/components/icons";
import { landingFor } from "@/lib/access";
import { cn } from "@/lib/cn";
import { isActive, visibleNav } from "@/lib/nav";
import { useHrms } from "@/lib/store";
import Link from "next/link";
import { usePathname } from "next/navigation";

/* A fixed 232px sidebar with labels always visible: the menu is short enough now that it
   never needs to collapse, and nobody has to hover to learn what an icon means. */
export function Sidebar() {
  const role = useHrms((s) => s.actingRole);
  const items = visibleNav(role);
  const path = usePathname();

  return (
    <aside className="relative z-40 hidden w-[232px] shrink-0 md:block">
      <div className="sticky top-0 flex h-[100dvh] flex-col border-r border-line bg-white py-5">
        <Link href={landingFor(role)} className="mb-6 px-5 text-ink">
          <Wordmark sub="Numaligarh Refinery" />
        </Link>
        <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto px-3 pb-4">
          {items.map((item) => {
            const active = isActive(item, path);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex h-9 items-center gap-3 rounded-lg px-2.5 text-[14px] transition-colors",
                  active ? "bg-fill font-medium text-ink" : "text-muted hover:bg-subtle hover:text-ink",
                )}
              >
                <span className={cn("grid h-5 w-5 shrink-0 place-items-center", active && "text-brand")}>
                  <NavIcon name={item.icon} size={18} />
                </span>
                <span className="truncate">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}

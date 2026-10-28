"use client";

import { cn } from "@/lib/cn";
import { routeAllowed } from "@/lib/access";
import { spring } from "@/lib/motion";
import { sectionFor } from "@/lib/nav";
import { useHrms } from "@/lib/store";
import { motion } from "motion/react";
import Link from "next/link";
import { usePathname } from "next/navigation";

/* Pages that share one menu entry (Pay run and Pay cost, Register and Muster) sit under
   these tabs, so the menu stays short and the related page is one tap away. */
export function SectionTabs() {
  const path = usePathname();
  const role = useHrms((s) => s.actingRole);
  const section = sectionFor(path, (href) => routeAllowed(href, role));
  if (!section) return null;
  return (
    <nav aria-label={section.label} className="-mx-4 mb-5 overflow-x-auto px-4 [scrollbar-width:none] md:mx-0 md:px-0">
      <div className="inline-flex min-w-max rounded-full bg-fill p-1">
        {section.pages.map((p) => {
          const on = path === p.href || path.startsWith(`${p.href}/`);
          return (
            <Link
              key={p.href}
              href={p.href}
              aria-current={on ? "page" : undefined}
              className={cn("relative rounded-lg px-4 py-1.5 text-sm font-semibold transition-colors", on ? "text-ink" : "text-muted hover:text-ink")}
            >
              {on && (
                <motion.span
                  layoutId={`section-${section.id}`}
                  transition={spring}
                  className="absolute inset-0 rounded-full bg-white"
                />
              )}
              <span className="relative whitespace-nowrap">{p.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

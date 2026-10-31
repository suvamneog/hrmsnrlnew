"use client";

import { routeAllowed } from "@/lib/access";
import { useHrms } from "@/lib/store";
import { Calculator, CalendarBlank, ClockCounterClockwise, FileText, Receipt } from "@phosphor-icons/react";
import Link from "next/link";

const ACTIONS = [
  { href: "/leave", label: "Leave", Icon: CalendarBlank, bg: "bg-ok-soft", ink: "text-ok" },
  { href: "/payslips", label: "Payslip", Icon: FileText, bg: "bg-brand-soft", ink: "text-brand" },
  { href: "/claims", label: "Claim", Icon: Receipt, bg: "bg-warn-soft", ink: "text-warn" },
  { href: "/tax", label: "Tax", Icon: Calculator, bg: "bg-[#fdeef4]", ink: "text-[#d4537e]" },
  { href: "/time", label: "Fix attendance", Icon: ClockCounterClockwise, bg: "bg-brand-soft", ink: "text-brand" },
] as const;

export function QuickActions() {
  const role = useHrms((s) => s.actingRole);
  const actions = ACTIONS.filter((a) => routeAllowed(a.href, role));
  if (actions.length === 0) return null;

  return (
    <div className="grid grid-cols-5 gap-2">
      {actions.map(({ href, label, Icon, bg, ink }) => (
        <Link
          key={href}
          href={href}
          className="flex flex-col items-center gap-2 rounded-xl px-1 py-2 transition hover:bg-white"
        >
          <span className={`grid h-12 w-12 place-items-center rounded-xl ${bg} ${ink}`}>
            <Icon size={22} weight="duotone" />
          </span>
          <span className="text-[12px] font-semibold">{label}</span>
        </Link>
      ))}
    </div>
  );
}

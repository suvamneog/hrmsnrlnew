"use client";

import { Calculator, CalendarBlank, ClockCounterClockwise, FileText, Receipt } from "@phosphor-icons/react";
import Link from "next/link";

const ACTIONS = [
  { href: "/leave", label: "Leave", Icon: CalendarBlank, bg: "bg-[#e7f8ef]", ink: "text-[#0f9f6e]" },
  { href: "/payslips", label: "Payslip", Icon: FileText, bg: "bg-[#eeeaff]", ink: "text-[#5b5bd6]" },
  { href: "/claims", label: "Claim", Icon: Receipt, bg: "bg-[#fff1e6]", ink: "text-[#e07a3d]" },
  { href: "/tax", label: "Tax", Icon: Calculator, bg: "bg-[#fdeef4]", ink: "text-[#d4537e]" },
  { href: "/time", label: "Regularise", Icon: ClockCounterClockwise, bg: "bg-[#e8f4ff]", ink: "text-[#2f7ec8]" },
] as const;

export function QuickActions() {
  return (
    <div className="grid grid-cols-5 gap-2">
      {ACTIONS.map(({ href, label, Icon, bg, ink }) => (
        <Link
          key={href}
          href={href}
          className="flex flex-col items-center gap-2 rounded-2xl px-1 py-2 transition hover:bg-white"
        >
          <span className={`grid h-12 w-12 place-items-center rounded-2xl ${bg} ${ink}`}>
            <Icon size={22} weight="duotone" />
          </span>
          <span className="text-[11px] font-semibold">{label}</span>
        </Link>
      ))}
    </div>
  );
}

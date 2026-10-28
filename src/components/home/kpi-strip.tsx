"use client";

import { AnimatedGroup } from "@/components/motion/animated-group";
import { AnimatedNumber } from "@/components/motion/animated-number";
import { CENSUS } from "@/lib/census";
import type { Role } from "@/lib/types";
import { ArrowUpRight } from "@phosphor-icons/react";
import Link from "next/link";

export type HomeKpi = {
  label: string;
  value: number | string;
  hint: string;
  href: string;
  tone: "mint" | "lilac" | "peach" | "pink" | "sky";
  count?: boolean;
};

/* Flat tiles in the Notion manner: the first figure leads in ink, the rest sit on white
   with a hairline. Tones stay on the type for callers, but colour no longer floods the tile. */
export function KpiStrip({ items }: { items: HomeKpi[] }) {
  if (items.length === 0) return null;
  return (
    <AnimatedGroup preset="slide" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {items.map((k, i) => {
        const lead = i === 0;
        return (
          <Link key={k.label} href={k.href} className="group block">
            <div
              className={`h-full rounded-[20px] p-5 transition-colors duration-300 ${
                lead ? "bg-ink text-white" : "border border-line bg-white text-ink hover:bg-[#fbfbfa]"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <p className={`text-[13px] font-medium ${lead ? "text-white/70" : "text-muted"}`}>{k.label}</p>
                <ArrowUpRight
                  size={14}
                  className={`shrink-0 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 ${lead ? "text-white/50" : "text-muted"}`}
                />
              </div>
              <p className="mt-5 text-[32px] font-semibold leading-none tracking-[-0.03em] tabular-nums">
                {k.count ? <AnimatedNumber value={Number(k.value)} /> : <span className="text-[22px] capitalize">{String(k.value)}</span>}
              </p>
              <p className={`mt-2 text-[12px] ${lead ? "text-white/60" : "text-muted"}`}>{k.hint}</p>
            </div>
          </Link>
        );
      })}
    </AnimatedGroup>
  );
}

export function buildHomeKpis(args: {
  role: Role | null;
  todoCount: number;
  inside: number;
  workers: number;
  blocked: number;
  contractors: number;
  teamSize: number;
  elBalance: number;
  myOpen: number;
  payrollStage?: string;
  latestSlip?: string;
  openings: number;
  interviews: number;
}): HomeKpi[] {
  const { role } = args;
  if (!role || role === "gate_security") return [];

  if (role === "contract_labour_cell" || role === "contractor_supervisor") {
    return [
      { label: "In plant", value: args.inside, hint: "Live gate count", href: "/gate", tone: "mint", count: true },
      { label: "On register", value: args.workers, hint: "Contract workmen", href: "/contractors", tone: "lilac", count: true },
      { label: "Not clear", value: args.blocked, hint: "Police / medical / induction", href: "/contractors", tone: "peach", count: true },
      { label: "Contractors", value: args.contractors, hint: "Work orders live", href: "/contractors", tone: "sky", count: true },
    ];
  }

  if (role === "safety_officer") {
    return [
      { label: "In plant", value: args.inside, hint: "Live gate count", href: "/gate", tone: "mint", count: true },
      { label: "Not clear", value: args.blocked, hint: "Induction or medical", href: "/safety", tone: "peach", count: true },
      { label: "On register", value: args.workers, hint: "Contract workmen", href: "/contractors", tone: "lilac", count: true },
      { label: "On leave", value: CENSUS.onLeave, hint: "Approved today", href: "/leave", tone: "sky", count: true },
    ];
  }

  if (role === "hr_admin" || role === "auditor") {
    return [
      { label: "On roll", value: CENSUS.onRoll, hint: "Demo sample; NRL: 1,120", href: "/people", tone: "mint", count: true },
      { label: "Waiting on you", value: args.todoCount, hint: "Leave, claims, swaps", href: "/approvals", tone: "peach", count: true },
      { label: "On leave", value: CENSUS.onLeave, hint: "Approved today", href: "/leave", tone: "lilac", count: true },
      { label: "In plant", value: args.inside, hint: "Contract workmen at gate", href: "/contractors", tone: "sky", count: true },
    ];
  }

  if (role === "payroll_officer" || role === "finance_approver") {
    return [
      { label: "On roll", value: CENSUS.onRoll, hint: "Demo sample; NRL: 1,120", href: "/people", tone: "mint", count: true },
      { label: "Payroll", value: (args.payrollStage ?? "draft").replace("_", " "), hint: "Current run", href: "/payroll", tone: "pink" },
      { label: "Waiting on you", value: args.todoCount, hint: "Claims and exceptions", href: "/approvals", tone: "peach", count: true },
      { label: "On leave", value: CENSUS.onLeave, hint: "Affects attendance", href: "/time", tone: "sky", count: true },
    ];
  }

  if (role === "recruiter") {
    return [
      { label: "Openings", value: args.openings, hint: "Live posts", href: "/recruitment", tone: "mint", count: true },
      { label: "Interviews", value: args.interviews, hint: "Medical and interview", href: "/recruitment", tone: "lilac", count: true },
      { label: "On roll", value: CENSUS.onRoll, hint: "Demo sample; NRL: 1,120", href: "/people", tone: "sky", count: true },
      { label: "Waiting on you", value: args.todoCount, hint: "Inbox", href: "/approvals", tone: "peach", count: true },
    ];
  }

  if (role === "line_manager") {
    return [
      { label: "Your crew", value: args.teamSize, hint: "Direct reports", href: "/people", tone: "mint", count: true },
      { label: "Waiting on you", value: args.todoCount, hint: "Leave, claims, swaps", href: "/approvals", tone: "peach", count: true },
      { label: "EL balance", value: args.elBalance, hint: "Your earned leave", href: "/leave", tone: "lilac", count: true },
      { label: "Open requests", value: args.myOpen, hint: "From you", href: "/approvals", tone: "sky", count: true },
    ];
  }

  return [
    { label: "EL balance", value: args.elBalance, hint: "Earned leave", href: "/leave", tone: "mint", count: true },
    { label: "Open requests", value: args.myOpen, hint: "Leave and claims", href: "/approvals", tone: "peach", count: true },
    { label: "On leave today", value: CENSUS.onLeave, hint: "Plant-wide", href: "/leave", tone: "lilac", count: true },
    { label: "Payslip", value: args.latestSlip ?? "—", hint: "Latest month", href: "/payslips", tone: "sky" },
  ];
}

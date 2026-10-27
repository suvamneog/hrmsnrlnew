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

const TONE: Record<HomeKpi["tone"], string> = {
  mint: "from-[#d9f6e6] to-[#e7f8ef] text-[#0f9f6e]",
  lilac: "from-[#ddd8ff] to-[#eeeaff] text-[#5b5bd6]",
  peach: "from-[#ffe0c8] to-[#fff1e6] text-[#e07a3d]",
  pink: "from-[#fbd7e6] to-[#fdeef4] text-[#d4537e]",
  sky: "from-[#cfe8ff] to-[#e8f4ff] text-[#2f7ec8]",
};

export function KpiStrip({ items }: { items: HomeKpi[] }) {
  if (items.length === 0) return null;
  return (
    <AnimatedGroup preset="slide" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {items.map((k) => (
        <Link key={k.label} href={k.href} className="group block">
          <div
            className={`relative overflow-hidden rounded-[22px] bg-gradient-to-br p-5 shadow-[0_10px_30px_rgba(45,64,180,0.07)] ${TONE[k.tone]}`}
          >
            <span className="pointer-events-none absolute -right-8 -top-10 h-28 w-28 rounded-full bg-white/45" />
            <span className="pointer-events-none absolute -bottom-8 right-10 h-16 w-16 rounded-full bg-white/30" />
            <div className="relative flex items-start justify-between gap-2">
              <p className="text-[12px] font-semibold text-ink/70">{k.label}</p>
              <span className="inline-flex items-center gap-0.5 text-[11px] font-bold tracking-wide text-ink/45 transition group-hover:text-ink/80">
                View
                <ArrowUpRight size={12} weight="bold" />
              </span>
            </div>
            <p className="relative mt-5 text-[28px] font-semibold leading-none tracking-tight text-ink">
              {k.count ? <AnimatedNumber value={Number(k.value)} /> : <span className="text-[22px] capitalize">{String(k.value)}</span>}
            </p>
            <p className="relative mt-2 text-[12px] text-ink/55">{k.hint}</p>
          </div>
        </Link>
      ))}
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
      { label: "On roll", value: CENSUS.onRoll, hint: `${CENSUS.executives} exec · ${CENSUS.workmen} workmen`, href: "/people", tone: "mint", count: true },
      { label: "Waiting on you", value: args.todoCount, hint: "Leave, claims, swaps", href: "/approvals", tone: "peach", count: true },
      { label: "On leave", value: CENSUS.onLeave, hint: "Approved today", href: "/leave", tone: "lilac", count: true },
      { label: "In plant", value: args.inside, hint: "Contract workmen at gate", href: "/contractors", tone: "sky", count: true },
    ];
  }

  if (role === "payroll_officer" || role === "finance_approver") {
    return [
      { label: "On roll", value: CENSUS.onRoll, hint: "October 2026", href: "/people", tone: "mint", count: true },
      { label: "Payroll", value: (args.payrollStage ?? "draft").replace("_", " "), hint: "Current run", href: "/payroll", tone: "pink" },
      { label: "Waiting on you", value: args.todoCount, hint: "Claims and exceptions", href: "/approvals", tone: "peach", count: true },
      { label: "On leave", value: CENSUS.onLeave, hint: "Affects attendance", href: "/time", tone: "sky", count: true },
    ];
  }

  if (role === "recruiter") {
    return [
      { label: "Openings", value: args.openings, hint: "Live posts", href: "/recruitment", tone: "mint", count: true },
      { label: "Interviews", value: args.interviews, hint: "Medical and interview", href: "/recruitment", tone: "lilac", count: true },
      { label: "On roll", value: CENSUS.onRoll, hint: "Plant strength", href: "/people", tone: "sky", count: true },
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
    { label: "Payslip", value: "Oct 2026", hint: "Latest month", href: "/payslips", tone: "sky" },
  ];
}

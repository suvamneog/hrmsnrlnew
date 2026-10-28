"use client";

import { MIN_MANNING } from "@/components/home/dashboard-charts";
import { canDecideFor, claimApproverRole } from "@/lib/access";
import { DEMO_TODAY } from "@/lib/demo";
import { CRITERIA, DOCS, useDesk } from "@/lib/desk";
import { SHIFT_CHANGE, lapseImpact, musterVsGate, shiftExceptions } from "@/lib/desk-analytics";
import { formatDay } from "@/lib/format";
import { easeOut } from "@/lib/motion";
import { useCurrentUser, useHrms } from "@/lib/store";
import { CaretRight } from "@phosphor-icons/react";
import { addDays, format, parseISO } from "date-fns";
import { motion, useReducedMotion } from "motion/react";
import Link from "next/link";
import { useMemo } from "react";

export type TodayItem = { id: string; label: string; detail?: string; href: string; tone: "danger" | "warn" | "brand" | "muted" };

// "1 muster", "2 musters".
const n = (count: number, one: string, many = `${one}s`) => `${count} ${count === 1 ? one : many}`;

const in30 = format(addDays(parseISO(DEMO_TODAY), 30), "yyyy-MM-dd");

/* What each role has to act on today, drawn from every desk, so nobody has to remember
   which menu item hides the work. Home shows all of it; Inbox shows what is not an approval. */
export function useToday(): TodayItem[] {
  const me = useCurrentUser();
  const role = useHrms((s) => s.actingRole);
  const hrms = useHrms();
  const desk = useDesk();

  return useMemo(() => {
    if (!me || !role) return [];
    const out: TodayItem[] = [];
    const add = (cond: unknown, item: TodayItem) => cond && out.push(item);
    const team = hrms.employees.filter((e) => e.managerId === me.id);
    const teamIds = new Set(team.map((e) => e.id));
    const decide = (id: string) => canDecideFor(role, me.id, id, teamIds);
    const approvals =
      hrms.leaveRequests.filter((l) => l.status === "pending" && decide(l.employeeId)).length +
      hrms.swaps.filter((s) => s.status === "pending" && decide(s.fromId)).length +
      hrms.regularisations.filter((r) => r.status === "pending" && decide(r.employeeId)).length +
      hrms.claims.filter((c) => {
        if (c.status !== "pending" || c.employeeId === me.id) return false;
        if (role === "finance_approver") return c.amount >= 25000;
        return claimApproverRole(c.amount).includes(role) && decide(c.employeeId);
      }).length;
    add(approvals, { id: "approvals", label: `${n(approvals, "approval")} waiting`, detail: "Leave, swaps, regularisations and claims", href: "/approvals", tone: "brand" });

    const myCases = desk.cases.filter((c) => c.raisedBy === me.id && c.status !== "resolved");
    const run = hrms.payrollRuns[0];

    if (role === "employee" || role === "line_manager") {
      const next = hrms.roster
        .filter((r) => r.employeeId === me.id && r.date > DEMO_TODAY && r.shiftId !== "OFF")
        .sort((a, b) => a.date.localeCompare(b.date))[0];
      const shift = hrms.shifts.find((s) => s.id === next?.shiftId);
      add(next && shift, { id: "next-shift", label: `Next shift ${formatDay(next?.date ?? DEMO_TODAY)}`, detail: shift ? `${shift.label}, ${shift.start} to ${shift.end}` : undefined, href: "/roster", tone: "muted" });
    }
    add(myCases.length, { id: "my-cases", label: myCases.length === 1 ? "1 of your cases is open" : `${myCases.length} of your cases are open`, detail: myCases[0]?.subject, href: "/cases", tone: "muted" });

    if (role === "line_manager") {
      const plant = shiftExceptions({ people: hrms.employees.filter((e) => e.crew), roster: hrms.roster, shifts: hrms.shifts, attendance: hrms.attendance, punches: hrms.punches, leave: hrms.leaveRequests });
      for (const s of SHIFT_CHANGE) {
        const on = plant.filter((r) => r.shift === s.code);
        const manned = on.filter((r) => r.issue === "ok" || r.issue === "late").length;
        add(on.length && manned < MIN_MANNING, { id: `short-${s.code}`, label: `${s.label} shift ${manned} of ${MIN_MANNING} manned`, detail: `Changeover at ${s.at}`, href: "/shift", tone: "danger" });
      }
      const mine = shiftExceptions({ people: team, roster: hrms.roster, shifts: hrms.shifts, attendance: hrms.attendance, punches: hrms.punches, leave: hrms.leaveRequests });
      const late = mine.filter((r) => r.issue === "late" || r.issue === "absent").length;
      add(late, { id: "late", label: `${late} of your crew late or not in`, href: "/shift", tone: "warn" });
      const lapses = lapseImpact({ people: hrms.employees.filter((e) => e.crew), roster: hrms.roster, certs: hrms.certificates, min: MIN_MANNING });
      add(lapses.length, { id: "lapses", label: `${n(lapses.length, "shift")} next week ${lapses.length === 1 ? "loses" : "lose"} manning`, detail: "Certificates lapsing", href: "/shift", tone: "warn" });
    }

    if (role === "line_manager" || role === "safety_officer") {
      const open = desk.incidents.filter((i) => i.status === "open");
      add(open.length, { id: "incidents", label: `${n(open.length, "incident")} open`, detail: open[0] ? `${open[0].kind}, ${open[0].area}` : undefined, href: "/permits", tone: "warn" });
      const risk = desk.permits.filter((p) => p.status === "active" && p.workerIds.some((w) => !hrms.certificates.some((c) => c.personId === w && c.courseId === p.courseId && c.expires >= DEMO_TODAY)));
      add(risk.length, { id: "permits", label: `${n(risk.length, "permit")} with blocked workers`, detail: risk[0]?.area, href: "/permits", tone: "danger" });
    }

    if (role === "hr_admin") {
      const changes = hrms.changes.filter((c) => c.status === "pending").length;
      add(changes, { id: "changes", label: `${n(changes, "record change")} to check`, href: "/people", tone: "warn" });
      const cases = desk.cases.filter((c) => c.status === "open").length;
      add(cases, { id: "cases", label: `${n(cases, "case")} not picked up`, detail: "Helpdesk, grievance, transfer, medical", href: "/cases", tone: "warn" });
      const seps = hrms.separations.filter((s) => s.status !== "settled");
      add(seps.length, { id: "seps", label: `${n(seps.length, "separation")} in clearance`, detail: seps[0] ? `Last day ${formatDay(seps[0].lastDay)}` : undefined, href: "/separation", tone: "muted" });
    }

    if (role === "payroll_officer" || role === "finance_approver") {
      const stage = run?.stage.replace("_", " ");
      add(run, { id: "run", label: `${format(parseISO(`${run?.month ?? "2026-10"}-01`), "MMMM")} run at ${stage}`, detail: run?.totals ? `${run.totals.blockers} blockers, ${run.totals.sapDiffs} SAP differences` : "Not computed yet", href: "/payroll", tone: role === "finance_approver" && run?.stage === "finance_approval" ? "danger" : "brand" });
      const last = hrms.payrollRuns.find((r) => r.results.length);
      const ex = last ? last.results.flatMap((r) => r.flags.map((f) => `${last.id}:${r.employeeId}:${f.code}`)).filter((k) => !desk.cleared[k]).length : 0;
      add(role === "finance_approver" && ex, { id: "exceptions", label: `${n(ex, "pay exception")} to clear`, href: "/finance", tone: "warn" });
      const ff = hrms.separations.filter((s) => s.status !== "settled").length;
      add(role === "payroll_officer" && ff, { id: "ff", label: `${n(ff, "final settlement")} pending`, href: "/separation", tone: "muted" });
    }

    if (role === "contract_labour_cell" || role === "contractor_supervisor") {
      const mineC = role === "contractor_supervisor" ? hrms.contractors.filter((c) => c.supervisorId === me.id || c.id === me.contractorId) : hrms.contractors;
      const ids = new Set(mineC.map((c) => c.id));
      const musters = desk.musters.filter((m) => ids.has(m.contractorId));
      if (role === "contract_labour_cell") {
        const check = musters.filter((m) => m.status === "submitted");
        const unseen = check.reduce((n, m) => n + musterVsGate(m.workerIds, m.date, hrms.passes, hrms.gateEvents).filter((x) => !x.seen).length, 0);
        add(check.length, { id: "musters", label: `${n(check.length, "muster")} to verify`, detail: unseen ? `${n(unseen, "worker day")} not seen at gate` : undefined, href: "/muster", tone: unseen ? "danger" : "warn" });
        const req = desk.workerRequests.filter((r) => r.status === "pending").length;
        add(req, { id: "workers", label: `${n(req, "worker registration")} requested`, href: "/muster", tone: "brand" });
        const ch = desk.challans.filter((c) => c.status === "pending" || c.status === "short").length;
        add(ch, { id: "challans", label: `${n(ch, "EPF or ESI challan")} to check`, href: "/muster", tone: "warn" });
      } else {
        const done = musters.some((m) => m.date === DEMO_TODAY);
        add(!done, { id: "muster-due", label: "Submit today's muster", detail: formatDay(DEMO_TODAY), href: "/muster", tone: "danger" });
        const req = desk.workerRequests.filter((r) => ids.has(r.contractorId) && r.status === "pending").length;
        add(req, { id: "workers", label: `${n(req, "worker request")} waiting on the Cell`, href: "/muster", tone: "muted" });
      }
      const lic = mineC.filter((c) => c.licenceExpiry <= in30);
      add(lic.length, { id: "licences", label: `${n(lic.length, "labour licence")} ${lic.length === 1 ? "expires" : "expire"} within 30 days`, detail: lic[0]?.name, href: "/contractors", tone: "warn" });
    }

    if (role === "safety_officer" || role === "contract_labour_cell") {
      const expired = hrms.certificates.filter((c) => c.expires < DEMO_TODAY).length;
      add(expired, { id: "expired", label: `${n(expired, "certificate")} expired`, detail: "Holders are blocked at the gate", href: "/safety", tone: "danger" });
      const soon = hrms.certificates.filter((c) => c.expires >= DEMO_TODAY && c.expires <= in30).length;
      add(role === "safety_officer" && soon, { id: "soon", label: `${n(soon, "certificate")} ${soon === 1 ? "expires" : "expire"} within 30 days`, href: "/safety", tone: "warn" });
    }

    if (role === "recruiter" || role === "hr_admin") {
      const upcoming = desk.interviews.filter((i) => !i.offerAt && i.at.slice(0, 10) >= DEMO_TODAY);
      add(upcoming.length, { id: "interviews", label: `${n(upcoming.length, "interview")} coming up`, detail: upcoming[0] ? formatDay(upcoming[0].at.slice(0, 10)) : undefined, href: "/interviews", tone: "brand" });
      const ready = desk.interviews.filter((i) => !i.offerAt && CRITERIA.every((k) => i.scores[k]) && DOCS.every((d) => i.docs[d])).length;
      add(ready, { id: "offers", label: `${n(ready, "offer")} ready to issue`, href: "/interviews", tone: "warn" });
    }

    if (role === "auditor") {
      const breaches = hrms.breaches.filter((b) => !b.notified).length;
      add(breaches, { id: "breaches", label: `${n(breaches, "DPDP breach", "DPDP breaches")} not notified`, href: "/audit", tone: "danger" });
      const today = hrms.audit.filter((a) => a.at.slice(0, 10) === new Date().toISOString().slice(0, 10)).length;
      add(today, { id: "audit", label: `${n(today, "audit event")} today`, href: "/audit", tone: "muted" });
    }

    return out;
  }, [me, role, hrms, desk]);
}

const DOT = { danger: "bg-[#e5484d]", warn: "bg-[#d4a24c]", brand: "bg-ink", muted: "bg-[#c7c7cc]" };

export function TodayList({ items, title = "Today", empty = "Nothing due today." }: { items: TodayItem[]; title?: string; empty?: string }) {
  const reduce = useReducedMotion();
  return (
    <section className="rounded-[20px] border border-line bg-white p-5 sm:p-6">
      <h2 className="text-[16px] font-semibold tracking-tight text-ink">{title}</h2>
      {items.length === 0 ? (
        <p className="mt-3 text-sm text-muted">{empty}</p>
      ) : (
        <ul className="-mx-2 mt-2 divide-y divide-line">
          {items.map((it, i) => (
            <motion.li
              key={it.id}
              initial={reduce ? false : { opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: easeOut, delay: reduce ? 0 : i * 0.04 }}
            >
              <Link href={it.href} className="group flex items-center gap-3 rounded-xl px-2 py-3 transition-colors hover:bg-[#f7f7f5]">
                <span className={`h-2 w-2 shrink-0 rounded-full ${DOT[it.tone]}`} aria-hidden />
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium text-ink">{it.label}</span>
                  {it.detail && <span className="block truncate text-[12px] text-muted">{it.detail}</span>}
                </span>
                <CaretRight size={14} className="shrink-0 text-muted transition-transform group-hover:translate-x-0.5" />
              </Link>
            </motion.li>
          ))}
        </ul>
      )}
    </section>
  );
}

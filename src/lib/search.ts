import { canSeePerson, routeAllowed } from "./access";
import type { CaseItem, Incident, Permit, Visitor } from "./desk";
import { NAV } from "./nav";
import type { Contractor, ContractWorker, Employee, LeaveBalance, LeaveType, Role } from "./types";

export type SearchHit = { href: string; label: string; meta: string };

export function commandHits(args: {
  q: string;
  role: Role | null;
  employees: Employee[];
  contractors: Contractor[];
  workers: ContractWorker[];
  balances: LeaveBalance[];
  types: LeaveType[];
  meId: string | null;
  desk?: { cases: CaseItem[]; permits: Permit[]; incidents: Incident[]; visitors: Visitor[] };
}): SearchHit[] {
  const s = args.q.trim().toLowerCase();
  if (s.length < 2) return [];

  const hits: SearchHit[] = [];
  const mine = args.balances.filter((b) => b.employeeId === args.meId);
  const me = args.employees.find((e) => e.id === args.meId) ?? null;
  const can = (href: string) => routeAllowed(href, args.role);

  if (can("/leave") && /leave|balance|\bel\b|\bcl\b|casual|hpl|earned|privilege/.test(s)) {
    for (const b of mine) {
      const t = args.types.find((x) => x.id === b.typeId);
      if (!t) continue;
      if (
        s.includes(t.code.toLowerCase()) ||
        t.name.toLowerCase().includes(s) ||
        /leave|balance/.test(s)
      ) {
        hits.push({
          href: "/leave",
          label: `${t.code} ${b.balance} days`,
          meta: t.name,
        });
      }
    }
    if (!hits.some((h) => h.href === "/leave")) {
      hits.push({ href: "/leave", label: "Apply leave", meta: "Leave" });
    }
  }
  if (can("/payslips") && /payslip|salary|slip|form 16|ctc|net pay/.test(s)) {
    hits.push({ href: "/payslips", label: "October slips & Form 16", meta: "Payslips" });
  }
  if (can("/tax") && /tax|80c|regime|declaration/.test(s)) {
    hits.push({ href: "/tax", label: "Tax declaration", meta: "ESS" });
  }
  if (can("/claims") && /claim|medical|ltc|bill|reimburse|tour/.test(s)) {
    hits.push({ href: "/claims", label: "File a claim", meta: "Claims" });
  }
  if (can("/time") && /punch|attendance|clock|check.?in|regular/.test(s)) {
    hits.push({ href: "/time", label: "Attendance and corrections", meta: "Time" });
  }
  if (can("/approvals") && /inbox|approv|waiting/.test(s)) {
    hits.push({ href: "/approvals", label: "Approvals inbox", meta: "Inbox" });
  }

  // Every page the role may open, including ones reached through section tabs rather than the menu.
  const pages = NAV.filter((n) => can(n.href) && n.label.toLowerCase().includes(s)).map((n) => ({
    href: n.href,
    label: n.label,
    meta: "Page",
  }));

  const d = args.desk;
  const hr = args.role === "hr_admin" || args.role === "auditor";
  const records: SearchHit[] = d
    ? [
        ...(can("/cases")
          ? d.cases
              .filter((c) => (hr || c.raisedBy === args.meId) && c.subject.toLowerCase().includes(s))
              .map((c) => ({ href: "/cases", label: c.subject, meta: "Case" }))
          : []),
        ...(can("/permits")
          ? d.permits.filter((p) => `${p.kind} ${p.area}`.toLowerCase().includes(s)).map((p) => ({ href: "/permits", label: p.area, meta: `Permit, ${p.kind}` }))
          : []),
        ...(can("/permits")
          ? d.incidents.filter((i) => `${i.kind} ${i.area} ${i.detail}`.toLowerCase().includes(s)).map((i) => ({ href: "/permits", label: i.area, meta: i.kind }))
          : []),
        ...(can("/visitors")
          ? d.visitors.filter((v) => `${v.name} ${v.org}`.toLowerCase().includes(s)).map((v) => ({ href: "/visitors", label: v.name, meta: v.org }))
          : []),
      ].slice(0, 6)
    : [];

  const people = can("/people")
    ? args.employees
        .filter((e) => e.name.toLowerCase().includes(s) || e.empNo.toLowerCase().includes(s))
        .filter((e) => canSeePerson(args.role, me, e))
        .slice(0, 5)
        .map((e) => ({ href: `/people/${e.id}`, label: e.name, meta: e.empNo }))
    : [];

  const contractors = can("/contractors")
    ? args.contractors
        .filter((c) => c.name.toLowerCase().includes(s) || c.licenceNo.toLowerCase().includes(s))
        .map((c) => ({ href: "/contractors", label: c.name, meta: c.licenceNo }))
    : [];

  const workers = can("/gate")
    ? args.workers
        .filter((w) => w.name.toLowerCase().includes(s))
        .slice(0, 4)
        .map((w) => ({ href: "/gate", label: w.name, meta: w.skill }))
    : [];

  const seen = new Set<string>();
  return [...hits, ...pages, ...records, ...people, ...contractors, ...workers].filter((h) => {
    const k = `${h.href}|${h.label}`;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  }).slice(0, 8);
}

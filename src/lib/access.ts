import { NAV, ON_ROLL } from "./nav";
import type { Employee, Role } from "./types";

export function isOnRoll(role: Role | null) {
  return !!role && ON_ROLL.includes(role);
}

// Gate staff are NRL employees too: their desk plus their own payslips, leave and cases.
export const GATE_PAGES = ["/gate", "/visitors", "/self", "/payslips", "/leave", "/cases"];

export function landingFor(role: Role | null) {
  if (role === "gate_security") return "/gate";
  if (role === "md") return "/md";
  return "/home";
}

export function routeAllowed(path: string, role: Role | null): boolean {
  if (!role) return false;
  if (role === "gate_security") return GATE_PAGES.includes(path) || path.startsWith("/gate/");
  const item = NAV.filter((n) => path === n.href || path.startsWith(`${n.href}/`)).sort(
    (a, b) => b.href.length - a.href.length,
  )[0];
  if (!item) return true;
  return item.roles === "all" || item.roles.includes(role);
}

export function canSeePayslip(role: Role | null, viewer: Employee | null, subject: Employee | null): boolean {
  if (!role || !viewer || !subject) return false;
  if (viewer.id === subject.id) return true;
  if (role === "payroll_officer" || role === "finance_approver" || role === "hr_admin" || role === "auditor") {
    return true;
  }
  if (role === "line_manager") return subject.managerId === viewer.id;
  return false;
}

export function canDecideFor(role: Role | null, viewerId: string, subjectId: string, teamIds: Set<string>) {
  if (subjectId === viewerId) return false;
  if (teamIds.has(subjectId)) return true;
  return role === "hr_admin";
}

export function canSeePii(role: Role | null): boolean {
  return role === "hr_admin" || role === "auditor" || role === "payroll_officer";
}

/* The MD sees everything the dashboards show and changes nothing. */
export function isReadOnly(role: Role | null) {
  return role === "md" || role === "auditor";
}

export function canMutateHr(role: Role | null): boolean {
  return role === "hr_admin";
}

export function canAdvancePayroll(role: Role | null, stage: string): boolean {
  if (role === "auditor") return false;
  if (stage === "finance_approval") return role === "finance_approver";
  if (stage === "bank_file" || stage === "publish") {
    return role === "payroll_officer" || role === "finance_approver";
  }
  // Lock, inputs, compute and validate belong to the maker; Finance only approves and releases.
  return role === "payroll_officer" || role === "hr_admin";
}

export function claimApproverRole(amount: number): Role[] {
  if (amount >= 25000) return ["finance_approver"];
  if (amount >= 10000) return ["hr_admin"];
  return ["line_manager", "hr_admin"];
}

export function canSeePerson(role: Role | null, viewer: Employee | null, subject: Employee | null) {
  if (!role || !viewer || !subject) return false;
  if (viewer.id === subject.id) return true;
  if (role === "line_manager") return subject.managerId === viewer.id;
  if (
    role === "hr_admin" ||
    role === "payroll_officer" ||
    role === "finance_approver" ||
    role === "auditor" ||
    role === "recruiter"
  ) {
    return true;
  }
  return false;
}

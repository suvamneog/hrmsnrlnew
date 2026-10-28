import { DEMOS, EMPLOYEES } from "./seed";
import type { Role } from "./types";

export const AD_PASSWORD = "Nrl@2026";
export const MFA_CODE = "246810";

const MFA_ROLES: Role[] = ["hr_admin", "payroll_officer", "finance_approver", "auditor", "md"];

export function roleFor(employeeId: string): Role {
  return DEMOS.find((d) => d.employeeId === employeeId)?.role ?? "employee";
}

export function needsMfa(role: Role) {
  return MFA_ROLES.includes(role);
}

export function resolveDirectory(user: string, password: string) {
  const q = user.trim().toLowerCase().replace(/\s+/g, "");
  if (!q) return { ok: false as const, reason: "Enter your employee number or email." };
  const person = EMPLOYEES.find((e) => {
    const email = e.email.toLowerCase();
    const emp = e.empNo.toLowerCase().replace(/\s+/g, "");
    return email === q || emp === q || email.split("@")[0] === q;
  });
  if (!person) return { ok: false as const, reason: "No NRL directory account matches that ID." };
  if (password !== AD_PASSWORD) return { ok: false as const, reason: "Password is incorrect." };
  const role = roleFor(person.id);
  return { ok: true as const, id: person.id, role, name: person.preferredName };
}

export function verifyMfa(code: string) {
  return code.replace(/\s/g, "") === MFA_CODE;
}

import type { Role } from "./types";

export interface NavItem {
  href: string;
  label: string;
  icon:
    | "house"
    | "users"
    | "tree"
    | "clock"
    | "calendar"
    | "swap"
    | "wallet"
    | "file"
    | "check"
    | "receipt"
    | "hardhat"
    | "gate"
    | "shield"
    | "briefcase"
    | "star"
    | "buildings"
    | "signout"
    | "chart"
    | "sliders"
    | "list"
    | "user";
  roles: Role[] | "all";
}

export const NAV: NavItem[] = [
  { href: "/home", label: "Home", icon: "house", roles: "all" },
  { href: "/self", label: "My space", icon: "user", roles: "all" },
  { href: "/approvals", label: "Inbox", icon: "check", roles: "all" },
  { href: "/people", label: "People", icon: "users", roles: ["hr_admin", "line_manager", "payroll_officer", "auditor", "recruiter"] },
  { href: "/organisation", label: "Organisation", icon: "tree", roles: ["hr_admin", "auditor"] },
  { href: "/time", label: "Attendance", icon: "clock", roles: ["employee", "line_manager", "hr_admin", "payroll_officer", "auditor"] },
  { href: "/roster", label: "Roster", icon: "calendar", roles: ["line_manager", "hr_admin", "employee"] },
  { href: "/leave", label: "Leave", icon: "swap", roles: "all" },
  { href: "/payroll", label: "Payroll", icon: "wallet", roles: ["payroll_officer", "finance_approver", "hr_admin", "auditor"] },
  { href: "/payslips", label: "Payslips", icon: "file", roles: ["employee", "line_manager", "hr_admin", "payroll_officer", "finance_approver", "auditor"] },
  { href: "/tax", label: "Tax", icon: "file", roles: ["employee", "line_manager", "payroll_officer"] },
  { href: "/claims", label: "Claims", icon: "receipt", roles: "all" },
  { href: "/contractors", label: "Contract labour", icon: "hardhat", roles: ["contract_labour_cell", "hr_admin", "safety_officer", "auditor", "contractor_supervisor"] },
  { href: "/gate", label: "Gate", icon: "gate", roles: ["gate_security", "contract_labour_cell", "safety_officer", "contractor_supervisor"] },
  { href: "/safety", label: "Safety", icon: "shield", roles: ["safety_officer", "hr_admin", "line_manager", "contract_labour_cell"] },
  { href: "/recruitment", label: "Recruitment", icon: "briefcase", roles: ["recruiter", "hr_admin"] },
  { href: "/performance", label: "Appraisal", icon: "star", roles: ["employee", "line_manager", "hr_admin"] },
  { href: "/township", label: "Township", icon: "buildings", roles: ["hr_admin", "employee"] },
  { href: "/separation", label: "Separation", icon: "signout", roles: ["hr_admin", "payroll_officer", "auditor"] },
  { href: "/reports", label: "Reports", icon: "chart", roles: ["hr_admin", "auditor", "recruiter"] },
  { href: "/policy", label: "Rules engine", icon: "sliders", roles: ["hr_admin", "payroll_officer", "finance_approver", "auditor"] },
  { href: "/audit", label: "Audit trail", icon: "list", roles: ["auditor", "hr_admin", "finance_approver"] },
];

export function visibleNav(role: Role | null) {
  if (!role) return NAV.filter((n) => n.roles === "all");
  if (role === "gate_security") return NAV.filter((n) => n.href === "/gate");
  return NAV.filter((n) => n.roles === "all" || n.roles.includes(role));
}

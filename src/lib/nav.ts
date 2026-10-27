import type { Role } from "./types";

export const ON_ROLL: Role[] = [
  "employee",
  "line_manager",
  "hr_admin",
  "payroll_officer",
  "finance_approver",
  "contract_labour_cell",
  "safety_officer",
  "recruiter",
  "auditor",
];

const STAFF: Role[] = [...ON_ROLL, "contractor_supervisor"];

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
    | "user"
    | "plugs";
  roles: Role[] | "all";
}

const ESS = ON_ROLL;

export const NAV: NavItem[] = [
  { href: "/home", label: "Home", icon: "house", roles: STAFF },
  { href: "/self", label: "My space", icon: "user", roles: STAFF },
  { href: "/approvals", label: "Inbox", icon: "check", roles: ESS },
  { href: "/people", label: "People", icon: "users", roles: ["hr_admin", "line_manager", "payroll_officer", "recruiter", "auditor"] },
  { href: "/organisation", label: "Organisation", icon: "tree", roles: ["hr_admin", "auditor"] },
  { href: "/time", label: "Attendance", icon: "clock", roles: ESS },
  { href: "/roster", label: "Roster", icon: "calendar", roles: ["line_manager", "hr_admin"] },
  { href: "/leave", label: "Leave", icon: "swap", roles: ESS },
  { href: "/payroll", label: "Payroll", icon: "wallet", roles: ["payroll_officer", "finance_approver", "hr_admin", "auditor"] },
  { href: "/payslips", label: "Payslips", icon: "file", roles: ESS },
  { href: "/tax", label: "Tax", icon: "file", roles: ESS },
  { href: "/claims", label: "Claims", icon: "receipt", roles: ESS },
  { href: "/contractors", label: "Contract labour", icon: "hardhat", roles: ["contract_labour_cell", "hr_admin", "safety_officer", "auditor", "contractor_supervisor"] },
  { href: "/gate", label: "Gate", icon: "gate", roles: ["gate_security", "contract_labour_cell", "safety_officer", "contractor_supervisor"] },
  { href: "/safety", label: "Safety", icon: "shield", roles: ["safety_officer", "hr_admin", "contract_labour_cell", "auditor"] },
  { href: "/recruitment", label: "Recruitment", icon: "briefcase", roles: ["recruiter", "hr_admin", "auditor"] },
  { href: "/performance", label: "Appraisal", icon: "star", roles: ESS },
  { href: "/township", label: "Township", icon: "buildings", roles: ESS },
  { href: "/separation", label: "Separation", icon: "signout", roles: ["hr_admin", "payroll_officer", "auditor"] },
  { href: "/reports", label: "Reports", icon: "chart", roles: ["hr_admin", "auditor", "recruiter", "payroll_officer"] },
  { href: "/policy", label: "Rules engine", icon: "sliders", roles: ["hr_admin", "payroll_officer", "finance_approver", "auditor"] },
  { href: "/interfaces", label: "Interfaces", icon: "plugs", roles: ["hr_admin", "payroll_officer", "finance_approver", "auditor"] },
  { href: "/audit", label: "Audit trail", icon: "list", roles: ["auditor", "hr_admin"] },
];

export function visibleNav(role: Role | null) {
  if (!role) return NAV.filter((n) => n.roles === "all");
  if (role === "gate_security") return NAV.filter((n) => n.href === "/gate");
  return NAV.filter((n) => n.roles === "all" || n.roles.includes(role));
}

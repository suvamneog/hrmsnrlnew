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
  // The MD is on the roll too: own payslip, leave, tax and profile, from the Me menu.
  "md",
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
    | "plugs"
    | "lifebuoy"
    | "visitor"
    | "fire"
    | "muster"
    | "panel"
    | "coins"
    | "gauge"
    | "warning";
  roles: Role[] | "all";
}

const ESS = ON_ROLL;

export const NAV: NavItem[] = [
  { href: "/md", label: "Overview", icon: "gauge", roles: ["md"] },
  { href: "/home", label: "Home", icon: "house", roles: STAFF },
  {
    href: "/self",
    label: "My space",
    icon: "user",
    roles: [...STAFF, "gate_security"],
  },
  { href: "/approvals", label: "Inbox", icon: "check", roles: ESS },
  {
    href: "/people",
    label: "People",
    icon: "users",
    roles: [
      "hr_admin",
      "line_manager",
      "payroll_officer",
      "recruiter",
      "auditor",
    ],
  },
  {
    href: "/organisation",
    label: "Organisation",
    icon: "tree",
    roles: ["hr_admin", "auditor", "md"],
  },
  {
    href: "/shift",
    label: "Shift desk",
    icon: "warning",
    roles: ["line_manager", "hr_admin"],
  },
  { href: "/time", label: "Attendance", icon: "clock", roles: ESS },
  {
    href: "/roster",
    label: "Roster",
    icon: "calendar",
    roles: ["employee", "line_manager", "hr_admin"],
  },
  { href: "/leave", label: "Leave", icon: "swap", roles: ESS },
  {
    href: "/payroll",
    label: "Payroll",
    icon: "wallet",
    roles: ["payroll_officer", "finance_approver", "hr_admin", "auditor"],
  },
  { href: "/payslips", label: "Payslips", icon: "file", roles: ESS },
  { href: "/tax", label: "Tax", icon: "file", roles: ESS },
  { href: "/claims", label: "Claims", icon: "receipt", roles: ESS },
  {
    href: "/contractors",
    label: "Contract labour",
    icon: "hardhat",
    roles: [
      "contract_labour_cell",
      "hr_admin",
      "safety_officer",
      "auditor",
      "contractor_supervisor",
    ],
  },
  {
    href: "/muster",
    label: "Muster",
    icon: "muster",
    roles: ["contractor_supervisor", "contract_labour_cell", "auditor"],
  },
  {
    href: "/gate",
    label: "Gate",
    icon: "gate",
    roles: [
      "gate_security",
      "contract_labour_cell",
      "safety_officer",
      "contractor_supervisor",
    ],
  },
  {
    href: "/visitors",
    label: "Visitors & vehicles",
    icon: "visitor",
    roles: ["gate_security", "safety_officer", "hr_admin"],
  },
  {
    href: "/safety",
    label: "Safety",
    icon: "shield",
    roles: ["safety_officer", "hr_admin", "contract_labour_cell", "auditor"],
  },
  {
    href: "/permits",
    label: "Permits & incidents",
    icon: "fire",
    roles: ["safety_officer", "line_manager", "hr_admin", "auditor"],
  },
  {
    href: "/recruitment",
    label: "Recruitment",
    icon: "briefcase",
    roles: ["recruiter", "hr_admin", "auditor"],
  },
  {
    href: "/interviews",
    label: "Interviews",
    icon: "panel",
    roles: ["recruiter", "hr_admin", "auditor"],
  },
  { href: "/performance", label: "Appraisal", icon: "star", roles: ESS },
  { href: "/township", label: "Township", icon: "buildings", roles: ESS },
  {
    href: "/separation",
    label: "Separation",
    icon: "signout",
    roles: ["hr_admin", "payroll_officer", "auditor"],
  },
  {
    href: "/finance",
    label: "Pay cost",
    icon: "coins",
    roles: ["finance_approver", "payroll_officer", "auditor", "md"],
  },
  {
    href: "/reports",
    label: "Reports",
    icon: "chart",
    roles: ["hr_admin", "auditor", "recruiter", "payroll_officer", "md"],
  },
  { href: "/cases", label: "Cases", icon: "lifebuoy", roles: ESS },
  {
    href: "/policy",
    label: "Rules engine",
    icon: "sliders",
    roles: ["hr_admin", "payroll_officer", "finance_approver", "auditor"],
  },
  {
    href: "/interfaces",
    label: "Interfaces",
    icon: "plugs",
    roles: ["hr_admin", "payroll_officer", "finance_approver", "auditor"],
  },
  {
    href: "/audit",
    label: "Audit trail",
    icon: "list",
    roles: ["auditor", "hr_admin"],
  },
];

/* Pages that do one job share a menu entry; the section tabs above each page move between them. */
export const SECTIONS: {
  id: string;
  label: string;
  pages: { href: string; label: string }[];
}[] = [
  {
    id: "me",
    label: "Me",
    pages: [
      { href: "/self", label: "Profile" },
      { href: "/payslips", label: "Payslips" },
      { href: "/leave", label: "Leave" },
      { href: "/tax", label: "Tax" },
      { href: "/claims", label: "Claims" },
      { href: "/performance", label: "Appraisal" },
      { href: "/township", label: "Township" },
      { href: "/cases", label: "Help and cases" },
    ],
  },
  {
    id: "time",
    label: "Attendance",
    pages: [
      { href: "/time", label: "Attendance" },
      { href: "/roster", label: "Roster" },
      { href: "/shift", label: "Shift desk" },
    ],
  },
  {
    id: "pay",
    label: "Payroll",
    pages: [
      { href: "/payroll", label: "Pay run" },
      { href: "/finance", label: "Pay cost" },
    ],
  },
  {
    id: "plant",
    label: "Contract and safety",
    pages: [
      { href: "/contractors", label: "Register" },
      { href: "/muster", label: "Muster and challans" },
      { href: "/safety", label: "Certificates" },
      { href: "/permits", label: "Permits and incidents" },
    ],
  },
  {
    id: "hiring",
    label: "Hiring",
    pages: [
      { href: "/recruitment", label: "Pipeline" },
      { href: "/interviews", label: "Interviews" },
    ],
  },
  {
    id: "gate",
    label: "Gate",
    pages: [
      { href: "/gate", label: "Pass check" },
      { href: "/visitors", label: "Visitors and vehicles" },
      { href: "/gate/handover", label: "Handover" },
    ],
  },
  {
    id: "admin",
    label: "Admin",
    pages: [
      { href: "/organisation", label: "Organisation" },
      { href: "/policy", label: "Rules engine" },
      { href: "/interfaces", label: "Interfaces" },
      { href: "/audit", label: "Audit trail" },
    ],
  },
];

export type MenuItem = {
  href: string;
  label: string;
  icon: NavItem["icon"];
  match: string[];
};

const item = (
  href: string,
  label: string,
  icon: NavItem["icon"],
  section?: string,
): MenuItem => ({
  href,
  label,
  icon,
  match: section
    ? SECTIONS.find((x) => x.id === section)!.pages.map((p) => p.href)
    : [href],
});

const ME = item("/self", "Me", "user", "me");

/* The menu each role actually uses day to day. Access is still decided by NAV above,
   so a page dropped from a menu stays reachable from its section tabs, Home or search. */
const MENU: Record<Role, MenuItem[]> = {
  employee: [
    item("/home", "Home", "house"),
    item("/time", "Attendance", "clock", "time"),
    item("/leave", "Leave", "swap"),
    ME,
  ],
  line_manager: [
    item("/home", "Home", "house"),
    item("/approvals", "Inbox", "check"),
    item("/shift", "Shift desk", "warning", "time"),
    item("/people", "Team", "users"),
    item("/permits", "Permits", "fire"),
    item("/leave", "Leave", "swap"),
    ME,
  ],
  hr_admin: [
    item("/home", "Home", "house"),
    item("/approvals", "Inbox", "check"),
    item("/people", "People", "users"),
    item("/time", "Attendance", "clock", "time"),
    item("/payroll", "Payroll", "wallet", "pay"),
    item("/cases", "Cases", "lifebuoy"),
    item("/recruitment", "Hiring", "briefcase", "hiring"),
    item("/contractors", "Contract and safety", "hardhat", "plant"),
    item("/separation", "Separation", "signout"),
    item("/reports", "Reports", "chart"),
    item("/organisation", "Admin", "sliders", "admin"),
    ME,
  ],
  payroll_officer: [
    item("/home", "Home", "house"),
    item("/approvals", "Inbox", "check"),
    item("/payroll", "Payroll", "wallet", "pay"),
    item("/separation", "Separation", "signout"),
    item("/reports", "Reports", "chart"),
    item("/policy", "Rules engine", "sliders"),
    ME,
  ],
  finance_approver: [
    item("/home", "Home", "house"),
    item("/approvals", "Inbox", "check"),
    item("/payroll", "Payroll", "wallet", "pay"),
    item("/interfaces", "Bank and files", "plugs"),
    ME,
  ],
  contract_labour_cell: [
    item("/home", "Home", "house"),
    item("/approvals", "Inbox", "check"),
    item("/contractors", "Contract labour", "hardhat", "plant"),
    item("/gate", "Gate", "gate", "gate"),
    item("/safety", "Safety", "shield"),
    ME,
  ],
  safety_officer: [
    item("/home", "Home", "house"),
    item("/approvals", "Inbox", "check"),
    item("/safety", "Certificates", "shield"),
    item("/permits", "Permits and incidents", "fire"),
    item("/gate", "Gate", "gate", "gate"),
    item("/contractors", "Contract labour", "hardhat", "plant"),
    ME,
  ],
  recruiter: [
    item("/home", "Home", "house"),
    item("/approvals", "Inbox", "check"),
    item("/recruitment", "Hiring", "briefcase", "hiring"),
    item("/reports", "Reports", "chart"),
    ME,
  ],
  auditor: [
    item("/home", "Overview", "house"),
    item("/people", "People", "users"),
    item("/payroll", "Payroll", "wallet", "pay"),
    item("/contractors", "Contract and safety", "hardhat", "plant"),
    item("/recruitment", "Hiring", "briefcase", "hiring"),
    item("/audit", "Audit trail", "list", "admin"),
    ME,
  ],
  contractor_supervisor: [
    item("/home", "Home", "house"),
    item("/muster", "Muster", "muster"),
    item("/gate", "Gate passes", "gate"),
  ],
  gate_security: [item("/gate", "Gate", "gate", "gate"), ME],
  md: [
    item("/md", "Overview", "gauge"),
    item("/organisation", "Organisation", "tree"),
    item("/finance", "Pay cost", "coins"),
    item("/reports", "Reports", "chart"),
    ME,
  ],
};

export function visibleNav(role: Role | null): MenuItem[] {
  if (!role) return [];
  const items = MENU[role];
  // A page with its own menu entry lights only that entry, not the section it also sits in.
  const own = new Set(items.map((i) => i.href));
  return items.map((i) => ({ ...i, match: i.match.filter((h) => h === i.href || !own.has(h)) }));
}

export function isActive(item: MenuItem, path: string) {
  return item.match.some((h) => path === h || path.startsWith(`${h}/`));
}

/* The section a page belongs to, with only the pages this role may open. */
export function sectionFor(path: string, can: (href: string) => boolean) {
  const s = SECTIONS.find((x) =>
    x.pages.some((p) => path === p.href || path.startsWith(`${p.href}/`)),
  );
  if (!s) return null;
  const pages = s.pages.filter((p) => can(p.href));
  return pages.length > 1 ? { ...s, pages } : null;
}

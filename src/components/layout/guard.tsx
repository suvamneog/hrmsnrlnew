"use client";

import { canSeePerson, routeAllowed } from "@/lib/access";
import { useCurrentUser, useHrms } from "@/lib/store";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function Guard({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const role = useHrms((s) => s.actingRole);
  const me = useCurrentUser();
  const employees = useHrms((s) => s.employees);
  const home = role === "gate_security" ? "/gate" : "/home";

  if (path.startsWith("/payroll/") && path !== "/payroll") {
    const id = path.split("/")[2];
    const subject = employees.find((e) => e.id === id);
    const team = subject && me && subject.managerId === me.id;
    const privileged =
      role === "payroll_officer" || role === "finance_approver" || role === "hr_admin" || role === "auditor";
    if (!me || (me.id !== id && !team && !privileged)) {
      return <Denied title="This payslip is not in your scope." href={home} />;
    }
  } else if (path.startsWith("/people/") && path !== "/people") {
    const id = path.split("/")[2];
    const subject = employees.find((e) => e.id === id) ?? null;
    if (!routeAllowed("/people", role) || !canSeePerson(role, me, subject)) {
      return <Denied title="This record is not in your scope." href={home} />;
    }
  } else if (!routeAllowed(path, role)) {
    return <Denied title="Your role cannot open this module." href={home} />;
  }

  return <>{children}</>;
}

function Denied({ title, href }: { title: string; href: string }) {
  return (
    <div className="mx-auto max-w-md py-20 text-center">
      <p className="text-lg font-semibold">{title}</p>
      <p className="mt-2 text-sm text-muted">This page is not in your role.</p>
      <Link href={href} className="mt-5 inline-block text-sm font-semibold text-brand">
        Back
      </Link>
    </div>
  );
}

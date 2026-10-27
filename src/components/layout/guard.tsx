"use client";

import { routeAllowed } from "@/lib/access";
import { useCurrentUser, useHrms } from "@/lib/store";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function Guard({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const role = useHrms((s) => s.actingRole);
  const me = useCurrentUser();
  const employees = useHrms((s) => s.employees);

  if (path.startsWith("/payroll/") && path !== "/payroll") {
    const id = path.split("/")[2];
    const subject = employees.find((e) => e.id === id);
    const team = subject && me && subject.managerId === me.id;
    const privileged =
      role === "payroll_officer" || role === "finance_approver" || role === "hr_admin" || role === "auditor";
    if (!me || (me.id !== id && !team && !privileged)) {
      return <Denied title="This payslip is not in your scope." />;
    }
  } else if (!routeAllowed(path, role)) {
    return <Denied title="Your role cannot open this module." />;
  }

  return <>{children}</>;
}

function Denied({ title }: { title: string }) {
  return (
    <div className="mx-auto max-w-md py-20 text-center">
      <p className="text-lg font-semibold">{title}</p>
      <p className="mt-2 text-sm text-muted">NRL People scopes records by role. The menu hid this; the page is closed too.</p>
      <Link href="/home" className="mt-5 inline-block text-sm font-semibold text-brand">
        Back to home
      </Link>
    </div>
  );
}

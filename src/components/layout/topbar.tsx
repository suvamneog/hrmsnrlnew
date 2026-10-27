"use client";

import { DemoNotice } from "@/components/layout/demo-notice";
import { Avatar } from "@/components/ui/avatar";
import { Bell, MagnifyingGlass, SignOut } from "@phosphor-icons/react";
import { DEMOS } from "@/lib/seed";
import { commandHits } from "@/lib/search";
import { useCurrentUser, useHrms } from "@/lib/store";
import type { Role } from "@/lib/types";
import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

const ROLE_LABEL: Record<Role, string> = {
  employee: "Employee",
  line_manager: "Line manager",
  hr_admin: "HR administrator",
  payroll_officer: "Payroll officer",
  finance_approver: "Finance approver",
  contract_labour_cell: "Contract labour cell",
  safety_officer: "Safety officer",
  gate_security: "Gate security",
  contractor_supervisor: "Contractor supervisor",
  recruiter: "Recruiter",
  auditor: "Auditor",
};

export function Topbar() {
  const user = useCurrentUser();
  const role = useHrms((s) => s.actingRole);
  const employees = useHrms((s) => s.employees);
  const contractors = useHrms((s) => s.contractors);
  const workers = useHrms((s) => s.workers);
  const balances = useHrms((s) => s.leaveBalances);
  const types = useHrms((s) => s.leaveTypes);
  const notes = useHrms((s) => s.notifications);
  const login = useHrms((s) => s.login);
  const logout = useHrms((s) => s.logout);
  const markRead = useHrms((s) => s.markRead);
  const router = useRouter();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const mine = notes.filter((n) => n.userId === user?.id && !n.read);

  const hits = useMemo(
    () =>
      commandHits({
        q,
        role,
        employees,
        contractors,
        workers,
        balances,
        types,
        meId: user?.id ?? null,
      }),
    [q, role, employees, contractors, workers, balances, types, user?.id],
  );

  if (!user || !role) return null;

  return (
    <header className="relative flex h-16 items-center gap-2 px-3 md:gap-3 md:px-7">
      <div className="relative hidden min-w-0 flex-1 md:block">
        <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={18} />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Leave balance, payslip, people…"
          className="h-11 w-full rounded-full border border-line bg-white pl-10 pr-4 text-sm outline-none focus:border-brand focus:ring-4 focus:ring-brand/10"
        />
        {hits.length > 0 && (
          <div className="absolute z-30 mt-2 w-full overflow-hidden rounded-2xl bg-white py-2 shadow-[0_16px_40px_rgba(45,64,180,0.12)]">
            {hits.map((h) => (
              <Link
                key={h.href + h.label}
                href={h.href}
                onClick={() => setQ("")}
                className="flex items-center justify-between px-4 py-2 text-sm hover:bg-brand-soft"
              >
                <span>{h.label}</span>
                <span className="text-xs text-muted">{h.meta}</span>
              </Link>
            ))}
          </div>
        )}
      </div>
      <DemoNotice tone="chip" />
      <button
        className="relative grid h-11 w-11 shrink-0 place-items-center rounded-full bg-white text-ink"
        onClick={() => setOpen((v) => !v)}
        aria-label="Notifications"
      >
        <Bell size={18} weight="duotone" />
        {mine.length > 0 && (
          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-[#e14b4b]" />
        )}
      </button>
      <label className="ml-auto flex h-11 min-w-0 items-center gap-2 rounded-full bg-white py-1 pl-1 pr-2 md:ml-0">
        <Avatar name={user.name} size={32} />
        <select
          className="max-w-[120px] bg-transparent text-xs font-semibold outline-none md:max-w-[148px]"
          value={`${user.id}:${role}`}
          onChange={(e) => {
            const [id, r] = e.target.value.split(":") as [string, Role];
            login(id, r);
            if (r === "gate_security") router.push("/gate");
          }}
        >
          {DEMOS.map((d) => {
            const e = employees.find((x) => x.id === d.employeeId);
            return (
              <option key={d.role} value={`${d.employeeId}:${d.role}`}>
                {ROLE_LABEL[d.role]} · {e?.preferredName}
              </option>
            );
          })}
        </select>
      </label>
      <button
        onClick={() => {
          logout();
          router.push("/");
        }}
        className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-white text-muted hover:text-ink"
        aria-label="Sign out"
      >
        <SignOut size={18} />
      </button>
      {open && (
        <div className="absolute right-20 top-16 z-40 w-80 rounded-2xl bg-white p-3 shadow-[0_16px_40px_rgba(45,64,180,0.12)]">
          <p className="px-2 pb-2 text-xs font-semibold text-muted">Inbox</p>
          {notes.filter((n) => n.userId === user.id).length === 0 && (
            <p className="px-2 py-6 text-sm text-muted">Caught up.</p>
          )}
          {notes
            .filter((n) => n.userId === user.id)
            .slice(0, 5)
            .map((n) => (
              <Link
                key={n.id}
                href={n.href}
                onClick={() => {
                  markRead(n.id);
                  setOpen(false);
                }}
                className="block rounded-xl px-3 py-2 hover:bg-brand-soft"
              >
                <p className="text-sm font-semibold">{n.title}</p>
                <p className="text-xs text-muted">{n.body}</p>
              </Link>
            ))}
        </div>
      )}
    </header>
  );
}

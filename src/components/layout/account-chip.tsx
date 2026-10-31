"use client";

import { Avatar } from "@/components/ui/avatar";
import { cn } from "@/lib/cn";
import { landingFor, routeAllowed } from "@/lib/access";
import { positionTitle } from "@/lib/org";
import { DEMOS } from "@/lib/seed";
import { useCurrentUser, useHrms } from "@/lib/store";
import { CaretDown } from "@phosphor-icons/react";
import { usePathname, useRouter } from "next/navigation";
import { useMemo, useState } from "react";

export function AccountChip() {
  const user = useCurrentUser();
  const employees = useHrms((s) => s.employees);
  const login = useHrms((s) => s.login);
  const router = useRouter();
  const path = usePathname();
  const [open, setOpen] = useState(false);

  const accounts = useMemo(
    () =>
      DEMOS.flatMap((d) => {
        const person = employees.find((e) => e.id === d.employeeId);
        return person ? [{ ...d, person }] : [];
      }),
    [employees],
  );

  if (!user) return null;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label="Switch account"
        className="flex h-11 min-w-0 max-w-[220px] items-center gap-2 rounded-full bg-white py-1 pl-1 pr-2 md:pr-3"
      >
        <Avatar name={user.name} size={32} />
        <div className="min-w-0 text-left">
          <p className="truncate text-xs font-semibold">{user.preferredName}</p>
          <p className="truncate text-[12px] text-muted">{positionTitle(user.positionId)}</p>
        </div>
        <CaretDown size={12} className="hidden shrink-0 text-muted md:block" weight="bold" />
      </button>
      {open && (
        <>
          <button
            type="button"
            className="fixed inset-0 z-30 cursor-default"
            aria-label="Close account menu"
            onClick={() => setOpen(false)}
          />
          <div
            role="listbox"
            className="absolute right-0 top-[calc(100%+8px)] z-40 max-h-[min(70vh,420px)] w-72 overflow-auto rounded-xl bg-white p-1.5 shadow-[0_8px_24px_rgba(0,0,0,0.08)]"
          >
            {accounts.map((a) => {
              const active = a.person.id === user.id;
              return (
                <button
                  key={a.employeeId}
                  type="button"
                  role="option"
                  aria-selected={active}
                  onClick={() => {
                    const dest =
                      a.role === "gate_security" || a.role === "md" || path === "/gate" || !routeAllowed(path, a.role)
                        ? landingFor(a.role)
                        : null;
                    login(a.employeeId, a.role);
                    setOpen(false);
                    if (dest) queueMicrotask(() => router.replace(dest));
                  }}
                  className={cn(
                    "flex w-full items-center gap-2 rounded-xl px-2 py-2 text-left hover:bg-brand-soft",
                    active && "bg-brand-soft",
                  )}
                >
                  <Avatar name={a.person.name} size={32} />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{a.person.preferredName}</p>
                    <p className="truncate text-[12px] text-muted">{positionTitle(a.person.positionId)}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

"use client";

import { Avatar } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { routeAllowed } from "@/lib/access";
import { cn } from "@/lib/cn";
import { positionTitle } from "@/lib/org";
import { useHrms } from "@/lib/store";
import type { Employee } from "@/lib/types";
import Link from "next/link";

/* Who this person reports to, all the way up, and who reports to them. Each name links to that
   person's record for roles allowed to open People; for everyone else it is plain text. */
export function ReportingLine({ person, self }: { person: Employee; self?: boolean }) {
  const employees = useHrms((s) => s.employees);
  const role = useHrms((s) => s.actingRole);
  const canOpen = routeAllowed("/people", role);

  // Walk up the managers; stop on a loop or a missing record.
  const chain: Employee[] = [];
  const seen = new Set([person.id]);
  for (let m = employees.find((e) => e.id === person.managerId); m && !seen.has(m.id); m = employees.find((e) => e.id === m!.managerId)) {
    chain.unshift(m);
    seen.add(m.id);
  }
  const reports = employees.filter((e) => e.managerId === person.id && !e.id.startsWith("g-"));
  const manager = chain.at(-1);

  const Row = ({ e, current }: { e: Employee; current?: boolean }) => {
    const body = (
      <span className={cn("flex min-w-0 items-center gap-3 rounded-lg px-2 py-1.5", current ? "bg-brand-soft" : canOpen && "hover:bg-subtle")}>
        <Avatar name={e.name} size={32} />
        <span className="min-w-0">
          <span className={cn("block truncate text-sm", current ? "font-semibold text-ink" : "font-medium text-ink")}>
            {e.name}
            {current && self && <span className="ml-1.5 text-[12px] font-medium text-brand">You</span>}
          </span>
          <span className="block truncate text-[12px] text-muted">{positionTitle(e.positionId)}</span>
        </span>
      </span>
    );
    return canOpen && !current ? <Link href={`/people/${e.id}`}>{body}</Link> : body;
  };

  return (
    <Card className="p-5">
      <h2 className="font-semibold">Reporting line</h2>
      <p className="mb-3 text-[12px] text-muted">
        {manager
          ? `${self ? "Your" : `${person.preferredName}'s`} leave, swaps and small claims go to ${manager.name}.`
          : "No reporting manager on record. HR approves requests."}
      </p>
      <ol className="relative">
        {[...chain, person].map((e, i, all) => (
          <li key={e.id} className="relative" style={{ paddingLeft: `${Math.min(i, 4) * 16}px` }}>
            {i < all.length - 1 && <span aria-hidden className="absolute bottom-0 top-9 w-px bg-line" style={{ left: `${Math.min(i, 4) * 16 + 24}px` }} />}
            <Row e={e} current={e.id === person.id} />
          </li>
        ))}
      </ol>
      {reports.length > 0 && (
        <div className="mt-4 border-t border-line pt-3">
          <p className="mb-2 text-[12px] font-semibold text-muted">
            {self ? "Reports to you" : "Direct reports"} ({reports.length})
          </p>
          <ul className="grid gap-1 sm:grid-cols-2">
            {reports.map((e) => (
              <li key={e.id}>
                <Row e={e} />
              </li>
            ))}
          </ul>
        </div>
      )}
    </Card>
  );
}

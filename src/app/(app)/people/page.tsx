"use client";

import { PageHeader } from "@/components/layout/page-header";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { liveCensus } from "@/lib/census";
import { positionTitle } from "@/lib/org";
import { empStatus } from "@/lib/status";
import { useCurrentUser, useHrms } from "@/lib/store";
import type { Cadre, Employee } from "@/lib/types";
import { FunnelSimple, MagnifyingGlass } from "@phosphor-icons/react";
import { format, parseISO } from "date-fns";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

const filters: { id: "all" | Cadre; label: string }[] = [
  { id: "all", label: "All" },
  { id: "executive", label: "Executives" },
  { id: "workman", label: "Workmen" },
  { id: "trainee", label: "Trainees" },
];

function rowStatus(e: Employee) {
  if (e.status !== "active") return { label: e.status === "probation" ? "Probation" : e.status === "notice" ? "Notice" : e.status === "retired" ? "Retired" : "Separated", tone: empStatus(e.status) };
  if (e.assignmentHistory.length > 1) return { label: "Transfer", tone: "brand" as const };
  return { label: "On board", tone: "ok" as const };
}

export default function PeoplePage() {
  const employees = useHrms((s) => s.employees);
  const role = useHrms((s) => s.actingRole);
  const me = useCurrentUser();
  const router = useRouter();
  const [q, setQ] = useState("");
  const [f, setF] = useState<(typeof filters)[number]["id"]>("all");
  const [page, setPage] = useState(0);
  const scoped = useMemo(() => {
    if (role === "line_manager" && me) {
      return employees.filter((e) => e.id === me.id || e.managerId === me.id);
    }
    return employees;
  }, [employees, role, me]);
  const census = liveCensus(role === "line_manager" ? scoped : employees);
  const rows = useMemo(() => {
    const hit = scoped.filter((e) => {
      const title = positionTitle(e.positionId);
      const match = `${e.name} ${e.empNo} ${e.grade} ${title}`.toLowerCase().includes(q.toLowerCase());
      return match && (f === "all" || e.cadre === f);
    });
    return [...hit].sort((a, b) => Number(a.id.startsWith("g-")) - Number(b.id.startsWith("g-")));
  }, [scoped, q, f]);
  const PAGE = 12;
  const pages = Math.max(1, Math.ceil(rows.length / PAGE));
  const slice = rows.slice(page * PAGE, page * PAGE + PAGE);
  const filterLabel = filters.find((x) => x.id === f)?.label ?? "All";

  return (
    <div>
      <PageHeader
        title={role === "line_manager" ? "Your crew" : "People"}
        subtitle={
          role === "line_manager"
            ? `${rows.length} in your reporting line`
            : `${census.onRoll.toLocaleString("en-IN")} on roll`
        }
        actions={
          role === "hr_admin" || role === "recruiter" ? (
            <Link href="/recruitment" className="text-sm font-semibold text-brand">
              Openings
            </Link>
          ) : undefined
        }
      />
      <Card className="overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
          <h2 className="font-semibold">Recent</h2>
          <div className="flex items-center gap-2">
            <label className="relative">
              <MagnifyingGlass size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
              <input
                value={q}
                onChange={(e) => {
                  setQ(e.target.value);
                  setPage(0);
                }}
                placeholder="Search for employee"
                className="h-10 w-[220px] rounded-full bg-[#f6f8fd] pl-9 pr-4 text-sm outline-none placeholder:text-muted focus:ring-4 focus:ring-brand/10"
              />
            </label>
            <Popover>
              <PopoverTrigger className="inline-flex h-10 items-center gap-2 rounded-full bg-[#f6f8fd] px-4 text-sm font-semibold text-ink">
                Filter
                <FunnelSimple size={16} weight="bold" className="text-muted" />
              </PopoverTrigger>
              <PopoverContent align="end" className="w-44 p-2">
                {filters.map((x) => (
                  <button
                    key={x.id}
                    type="button"
                    onClick={() => {
                      setF(x.id);
                      setPage(0);
                    }}
                    className={`flex w-full rounded-xl px-3 py-2 text-left text-sm font-semibold ${
                      f === x.id ? "bg-brand-soft text-brand" : "text-ink hover:bg-[#f6f8fd]"
                    }`}
                  >
                    {x.label}
                  </button>
                ))}
              </PopoverContent>
            </Popover>
          </div>
        </div>
        {f !== "all" && <p className="px-5 pb-2 text-xs text-muted">Showing {filterLabel.toLowerCase()}</p>}
        <div className="overflow-x-auto">
          <table className="min-w-[720px] w-full text-sm">
            <thead className="text-left text-[12px] font-medium text-muted">
              <tr>
                <th className="px-5 py-2 font-medium">Date</th>
                <th className="py-2 font-medium">Employee ID</th>
                <th className="py-2 font-medium">Name</th>
                <th className="py-2 font-medium">Role</th>
                <th className="px-5 py-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {slice.map((e) => {
                const st = rowStatus(e);
                return (
                  <tr
                    key={e.id}
                    className="cursor-pointer border-t border-line/80 transition hover:bg-[#f6f8fd]"
                    onClick={() => router.push(`/people/${e.id}`)}
                  >
                    <td className="px-5 py-3.5 tabular-nums text-muted">{format(parseISO(e.doj), "dd-MM-yy")}</td>
                    <td className="py-3.5 font-medium">{e.empNo}</td>
                    <td className="py-3.5">
                      <span className="flex items-center gap-2.5">
                        <Avatar name={e.name} size={32} />
                        <span className="font-semibold">{e.name}</span>
                      </span>
                    </td>
                    <td className="py-3.5 text-muted">
                      {positionTitle(e.positionId)} · {e.grade}
                    </td>
                    <td className="px-5 py-3.5">
                      <Badge tone={st.tone}>{st.label}</Badge>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between border-t border-line px-5 py-3 text-xs text-muted">
          <p>
            {page * PAGE + 1}–{Math.min((page + 1) * PAGE, rows.length)} of {rows.length.toLocaleString("en-IN")}
          </p>
          <div className="flex gap-3">
            <button disabled={page === 0} className="font-semibold disabled:opacity-40" onClick={() => setPage((p) => p - 1)}>
              Previous
            </button>
            <button disabled={page + 1 >= pages} className="font-semibold disabled:opacity-40" onClick={() => setPage((p) => p + 1)}>
              Next
            </button>
          </div>
        </div>
      </Card>
    </div>
  );
}

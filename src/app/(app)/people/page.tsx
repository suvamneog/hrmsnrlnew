"use client";

import { PageHeader } from "@/components/layout/page-header";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { liveCensus } from "@/lib/census";
import { locationName, positionTitle, unitName } from "@/lib/org";
import { cadreTone, empStatus } from "@/lib/status";
import { useHrms } from "@/lib/store";
import type { Cadre } from "@/lib/types";
import Link from "next/link";
import { useMemo, useState } from "react";

const filters: { id: "all" | Cadre; label: string }[] = [
  { id: "all", label: "All" },
  { id: "executive", label: "Executives" },
  { id: "workman", label: "Workmen" },
  { id: "trainee", label: "Trainees" },
];

export default function PeoplePage() {
  const employees = useHrms((s) => s.employees);
  const role = useHrms((s) => s.actingRole);
  const [q, setQ] = useState("");
  const [f, setF] = useState<(typeof filters)[number]["id"]>("all");
  const [page, setPage] = useState(0);
  const census = liveCensus(employees);
  const rows = useMemo(() => {
    const hit = employees.filter((e) => {
      const title = positionTitle(e.positionId);
      const match = `${e.name} ${e.empNo} ${e.grade} ${title}`.toLowerCase().includes(q.toLowerCase());
      return match && (f === "all" || e.cadre === f);
    });
    return [...hit].sort((a, b) => Number(a.id.startsWith("g-")) - Number(b.id.startsWith("g-")));
  }, [employees, q, f]);
  const PAGE = 48;
  const pages = Math.max(1, Math.ceil(rows.length / PAGE));
  const slice = rows.slice(page * PAGE, page * PAGE + PAGE);

  return (
    <div>
      <PageHeader
        title={`People (${census.onRoll.toLocaleString("en-IN")} on roll)`}
        subtitle="Directory of NRL. Cadre, grade and location are effective-dated. Joining is recorded in Recruitment."
        actions={
          role === "hr_admin" || role === "recruiter" ? (
            <Link href="/recruitment" className="text-sm font-semibold text-brand">
              Openings
            </Link>
          ) : undefined
        }
      />
      <div className="mb-5 flex flex-wrap items-center gap-2">
        <Input
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setPage(0);
          }}
          placeholder="Name, employee number, grade, post"
          className="max-w-sm rounded-full"
        />
        {filters.map((x) => (
          <button
            key={x.id}
            onClick={() => {
              setF(x.id);
              setPage(0);
            }}
            className={`rounded-full px-3 py-1.5 text-sm font-semibold ${f === x.id ? "bg-brand text-white" : "bg-white text-muted"}`}
          >
            {x.label}
          </button>
        ))}
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {slice.map((e) => (
          <Link key={e.id} href={`/people/${e.id}`} className="block rounded-[22px] bg-white p-4 shadow-[0_10px_30px_rgba(45,64,180,0.07)] transition hover:-translate-y-0.5">
            <div className="flex items-start justify-between">
              <Avatar name={e.name} size={56} />
              <Badge tone={empStatus(e.status)}>{e.status}</Badge>
            </div>
            <p className="mt-3 font-semibold">{e.name}</p>
            <p className="text-xs text-muted">{positionTitle(e.positionId)}</p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              <Badge tone={cadreTone(e.cadre)}>{e.grade}</Badge>
              <Badge>{unitName(e.unitId)}</Badge>
            </div>
            <p className="mt-3 text-[11px] text-muted">
              {e.empNo} · {locationName(e.locationId).split(" ")[0]}
            </p>
          </Link>
        ))}
      </div>
      <div className="mt-4 flex items-center justify-between text-xs text-muted">
        <p>
          {page * PAGE + 1}–{Math.min((page + 1) * PAGE, rows.length)} of {rows.length.toLocaleString("en-IN")}
        </p>
        <div className="flex gap-2">
          <button disabled={page === 0} className="font-semibold disabled:opacity-40" onClick={() => setPage((p) => p - 1)}>
            Previous
          </button>
          <button disabled={page + 1 >= pages} className="font-semibold disabled:opacity-40" onClick={() => setPage((p) => p + 1)}>
            Next
          </button>
        </div>
      </div>
    </div>
  );
}

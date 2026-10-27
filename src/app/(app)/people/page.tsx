"use client";

import { PageHeader } from "@/components/layout/page-header";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, Input, Select } from "@/components/ui/input";
import { liveCensus } from "@/lib/census";
import { downloadText } from "@/lib/files";
import { locationName, positionTitle, unitName } from "@/lib/org";
import { nrlExtractCsv, sapMismatch } from "@/lib/sap";
import { cadreTone, empStatus } from "@/lib/status";
import { useHrms } from "@/lib/store";
import type { Cadre, Category } from "@/lib/types";
import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import { toast } from "sonner";

const filters: { id: "all" | Cadre; label: string }[] = [
  { id: "all", label: "All" },
  { id: "executive", label: "Executives" },
  { id: "workman", label: "Workmen" },
  { id: "trainee", label: "Trainees" },
];

export default function PeoplePage() {
  const employees = useHrms((s) => s.employees);
  const positions = useHrms((s) => s.positions);
  const sapHr = useHrms((s) => s.sapHr);
  const role = useHrms((s) => s.actingRole);
  const hire = useHrms((s) => s.hireEmployee);
  const acceptSap = useHrms((s) => s.acceptSap);
  const acceptSapAll = useHrms((s) => s.acceptSapAll);
  const importSapCsv = useHrms((s) => s.importSapCsv);
  const fileRef = useRef<HTMLInputElement>(null);
  const [q, setQ] = useState("");
  const [f, setF] = useState<(typeof filters)[number]["id"]>("all");
  const [page, setPage] = useState(0);
  const census = liveCensus(employees);
  const [name, setName] = useState("");
  const [grade, setGrade] = useState("E2");
  const [positionId, setPositionId] = useState(positions.find((p) => p.vacant)?.id ?? positions[0]?.id ?? "");
  const rows = useMemo(() => {
    const hit = employees.filter((e) => {
      const match = `${e.name} ${e.empNo} ${e.grade}`.toLowerCase().includes(q.toLowerCase());
      return match && (f === "all" || e.cadre === f);
    });
    return [...hit].sort((a, b) => Number(a.id.startsWith("g-")) - Number(b.id.startsWith("g-")));
  }, [employees, q, f]);
  const PAGE = 48;
  const pages = Math.max(1, Math.ceil(rows.length / PAGE));
  const slice = rows.slice(page * PAGE, page * PAGE + PAGE);
  const mismatches = sapMismatch(employees, sapHr);

  return (
    <div>
      <PageHeader
        title={`People (${census.onRoll.toLocaleString("en-IN")} on roll)`}
        subtitle="One record per person, with history. Cadre, grade and location are effective-dated."
      />
      <div className="mb-5 flex flex-wrap items-center gap-2">
        <Input
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setPage(0);
          }}
          placeholder="Name, employee number, grade"
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
      {role === "hr_admin" && (
        <Card className="mb-5 grid gap-3 p-4 md:grid-cols-4">
          <Field label="Hire">
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" />
          </Field>
          <Field label="Grade">
            <Input value={grade} onChange={(e) => setGrade(e.target.value)} />
          </Field>
          <Field label="Position">
            <Select value={positionId} onChange={(e) => setPositionId(e.target.value)}>
              {positions.filter((p) => !p.id.startsWith("p-str-")).map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title}
                  {p.vacant ? " (vacant)" : ""}
                </option>
              ))}
            </Select>
          </Field>
          <div className="flex items-end">
            <Button
              onClick={() => {
                const pos = positions.find((p) => p.id === positionId);
                const r = hire({
                  name,
                  cadre: (pos?.cadre ?? "executive") as Cadre,
                  grade,
                  unitId: pos?.unitId ?? "hr",
                  positionId,
                  category: "UR" as Category,
                  gender: "O",
                  basic: 58600,
                });
                if (!r.ok) toast.error(r.reason);
                else {
                  toast.success("Hired on probation");
                  setName("");
                }
              }}
            >
              Hire
            </Button>
          </div>
        </Card>
      )}
      {role === "hr_admin" && (
        <Card className="mb-5 p-4">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="font-semibold">SAP HR reconciliation</p>
              <p className="text-xs text-muted">CSV columns EMPNO, NAME, GRADE, BASIC, UNIT. Import replaces matching employee numbers.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="secondary"
                onClick={() => downloadText("NRL_HR_EXTRACT.csv", nrlExtractCsv(employees), "text/csv")}
              >
                NRL extract
              </Button>
              <Button variant="secondary" onClick={() => fileRef.current?.click()}>
                Import SAP CSV
              </Button>
              {mismatches.length > 0 && (
                <Button
                  onClick={() => {
                    const n = acceptSapAll();
                    toast.success(`Accepted SAP values for ${n}`);
                  }}
                >
                  Accept all
                </Button>
              )}
            </div>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={(ev) => {
              const file = ev.target.files?.[0];
              ev.target.value = "";
              if (!file) return;
              file.text().then((text) => {
                const r = importSapCsv(text);
                if (!r.ok) toast.error(r.reason);
                else toast.success(`Imported ${r.imported} · ${r.mismatches} differences`);
              });
            }}
          />
          {mismatches.length === 0 && <p className="text-sm text-muted">No differences against the last SAP file.</p>}
          {mismatches.slice(0, 12).map((m) => (
            <div key={m.s.empNo} className="flex items-center justify-between py-1 text-sm">
              <span>
                {m.s.name} · {m.issue}
              </span>
              {m.e && (
                <button
                  className="text-xs font-semibold text-brand"
                  onClick={() => {
                    acceptSap(m.s.empNo);
                    toast.success("Accepted SAP values");
                  }}
                >
                  Accept SAP
                </button>
              )}
            </div>
          ))}
          {mismatches.length > 12 && <p className="mt-2 text-xs text-muted">{mismatches.length - 12} more · Accept all to apply</p>}
        </Card>
      )}
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

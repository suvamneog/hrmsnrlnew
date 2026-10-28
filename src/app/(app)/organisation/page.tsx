"use client";

import { HeadcountCharts } from "@/components/charts/page-charts";

import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, Input, Select } from "@/components/ui/input";
import { UNITS } from "@/lib/org";
import { useHrms } from "@/lib/store";
import type { Cadre } from "@/lib/types";
import { useMemo, useState } from "react";
import { toast } from "sonner";

export default function OrgPage() {
  const employees = useHrms((s) => s.employees);
  const positions = useHrms((s) => s.positions);
  const role = useHrms((s) => s.actingRole);
  const createVacancy = useHrms((s) => s.createVacancy);
  const [title, setTitle] = useState("");
  const [unitId, setUnitId] = useState("tech");
  const [grade, setGrade] = useState("E2");
  const roots = UNITS.filter((u) => u.kind === "location");
  const onRoll = useMemo(
    () => employees.filter((e) => e.cadre !== "contract" && e.status !== "separated"),
    [employees],
  );
  const byUnit = useMemo(() => {
    const m = new Map<string, { n: number; exec: number; work: number; train: number }>();
    for (const e of onRoll) {
      const row = m.get(e.unitId) ?? { n: 0, exec: 0, work: 0, train: 0 };
      row.n += 1;
      if (e.cadre === "executive") row.exec += 1;
      else if (e.cadre === "workman") row.work += 1;
      else if (e.cadre === "trainee") row.train += 1;
      m.set(e.unitId, row);
    }
    return m;
  }, [onRoll]);
  const byPosition = useMemo(() => {
    const m = new Map<string, number>();
    for (const e of onRoll) m.set(e.positionId, (m.get(e.positionId) ?? 0) + 1);
    return m;
  }, [onRoll]);

  function rollIn(ids: string[]) {
    return ids.reduce((s, id) => s + (byUnit.get(id)?.n ?? 0), 0);
  }

  return (
    <div>
      <PageHeader
        title="Organisation"
        subtitle={`${onRoll.length.toLocaleString("en-IN")} on roll across Numaligarh, Siliguri, Paradip and Guwahati.`}
      />
      <div className="mb-6">
        <HeadcountCharts />
      </div>
      {role === "hr_admin" && (
        <Card className="mb-5 grid gap-3 p-4 md:grid-cols-4">
          <Field label="New post">
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Post title" />
          </Field>
          <Field label="Unit">
            <Select value={unitId} onChange={(e) => setUnitId(e.target.value)}>
              {UNITS.filter((u) => u.kind === "unit" || u.kind === "department").map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Grade">
            <Input value={grade} onChange={(e) => setGrade(e.target.value)} />
          </Field>
          <div className="flex items-end">
            <Button
              onClick={() => {
                if (!title.trim()) {
                  toast.error("Enter a post title.");
                  return;
                }
                createVacancy(title.trim(), unitId, grade, "executive" as Cadre);
                toast.success("Vacancy opened");
                setTitle("");
              }}
            >
              Create vacancy
            </Button>
          </div>
        </Card>
      )}
      <div className="grid gap-4">
        {roots.map((loc) => {
          const depts = UNITS.filter((u) => u.parentId === loc.id);
          const locUnits = UNITS.filter((u) => u.locationId === loc.locationId && u.kind !== "company" && u.kind !== "location");
          const locCount = rollIn(locUnits.map((u) => u.id));
          return (
            <Card key={loc.id} className="p-5">
              <div className="flex items-baseline justify-between gap-3">
                <h2 className="font-semibold">{loc.name}</h2>
                <p className="text-xs text-muted">{locCount.toLocaleString("en-IN")} on roll</p>
              </div>
              <div className="mt-3 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {(depts.length ? depts : [loc]).map((d) => {
                  const units = UNITS.filter((u) => u.parentId === d.id);
                  const ids = [d.id, ...units.map((u) => u.id)];
                  const posts = positions.filter((p) => ids.includes(p.unitId) && !p.id.startsWith("p-str-"));
                  const count = rollIn(ids);
                  const mix = ids.reduce(
                    (acc, id) => {
                      const row = byUnit.get(id);
                      if (!row) return acc;
                      return { exec: acc.exec + row.exec, work: acc.work + row.work, train: acc.train + row.train };
                    },
                    { exec: 0, work: 0, train: 0 },
                  );
                  return (
                    <div key={d.id} className="rounded-2xl bg-[#f6f8fd] p-3">
                      <p className="text-sm font-semibold">{d.name}</p>
                      <p className="mt-1 text-xs text-muted">
                        {count.toLocaleString("en-IN")} on roll
                        {count > 0 ? ` · ${mix.exec} E · ${mix.work} W · ${mix.train} T` : ""}
                      </p>
                      <ul className="mt-2 space-y-1">
                        {posts.map((p) => {
                          const n = byPosition.get(p.id) ?? 0;
                          const holder = onRoll.find((e) => e.positionId === p.id && !e.id.startsWith("g-"));
                          return (
                            <li key={p.id} className="flex items-center justify-between gap-2 text-xs">
                              <span className="min-w-0 truncate">{p.title}</span>
                              {p.vacant && n === 0 ? (
                                <Badge tone="warn">vacant</Badge>
                              ) : n <= 1 ? (
                                <span className="shrink-0 text-muted">{holder?.preferredName ?? (n ? "1" : "—")}</span>
                              ) : (
                                <span className="shrink-0 text-muted">{n.toLocaleString("en-IN")}</span>
                              )}
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  );
                })}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

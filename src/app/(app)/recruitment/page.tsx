"use client";

import { RecruitmentCharts } from "@/components/charts/page-charts";
import { PipelineBoard } from "@/components/hiring/pipeline-board";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FileDownload, FileDownloadList } from "@/components/ui/file-download";
import { Field, Input, Select } from "@/components/ui/input";
import { downloadText, prettySize } from "@/lib/files";
import { ExpandableCard } from "@/components/ui/expandable-card";
import { IdentificationBadge } from "@phosphor-icons/react";
import { useCurrentUser, useHrms } from "@/lib/store";
import type { Cadre } from "@/lib/types";
import { toast } from "sonner";
import { useState } from "react";

export default function RecruitmentPage() {
  const openings = useHrms((s) => s.openings);
  const candidates = useHrms((s) => s.candidates);
  const points = useHrms((s) => s.rosterPoints);
  const role = useHrms((s) => s.actingRole);
  const addOpening = useHrms((s) => s.addOpening);
  const tickOnboarding = useHrms((s) => s.tickOnboarding);
  const [post, setPost] = useState("Engineer trainee (Chemical)");
  const [grade, setGrade] = useState("ET");
  const [cadre, setCadre] = useState<Cadre>("trainee");
  const [vacancies, setVacancies] = useState("8");
  const me = useCurrentUser();
  const canEdit = role === "recruiter" || role === "hr_admin";

  return (
    <div>
      <PageHeader
        title="Recruitment"
        subtitle="GATE 2026 engineer trainee and workmen intake, with the reservation roster for each post."
      />
      <PipelineBoard />
      <RecruitmentCharts />
      {canEdit && (
        <Card className="mb-5 p-5">
          <form
            className="grid gap-3 sm:grid-cols-4"
            onSubmit={(e) => {
              e.preventDefault();
              const n = Number(vacancies);
              addOpening({
                post,
                grade,
                cadre,
                vacancies: n,
                split: { UR: Math.ceil(n * 0.4), OBC: Math.ceil(n * 0.27), SC: Math.ceil(n * 0.15), ST: Math.ceil(n * 0.075), EWS: Math.max(0, n - Math.ceil(n * 0.4) - Math.ceil(n * 0.27) - Math.ceil(n * 0.15) - Math.ceil(n * 0.075)), PwBD: 0 },
              });
              toast.success(`Opening posted: ${post}`);
            }}
          >
            <Field label="Post">
              <Input value={post} onChange={(e) => setPost(e.target.value)} required />
            </Field>
            <Field label="Grade">
              <Input value={grade} onChange={(e) => setGrade(e.target.value)} required />
            </Field>
            <Field label="Cadre">
              <Select value={cadre} onChange={(e) => setCadre(e.target.value as Cadre)}>
                <option value="trainee">Trainee</option>
                <option value="executive">Executive</option>
                <option value="workman">Workman</option>
              </Select>
            </Field>
            <Field label="Vacancies">
              <Input type="number" min={1} value={vacancies} onChange={(e) => setVacancies(e.target.value)} required />
            </Field>
            <div className="sm:col-span-4">
              <Button type="submit">Post opening</Button>
            </div>
          </form>
        </Card>
      )}
      <div className="grid min-w-0 gap-4">
        {openings.map((o) => (
          <Card key={o.id} className="min-w-0 p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="font-semibold">{o.post}</h2>
                <p className="text-sm text-muted">
                  {o.grade} · {o.vacancies} posts
                </p>
              </div>
              <Badge tone="lilac">{o.status}</Badge>
            </div>
            <div className="mt-3 flex flex-wrap gap-2 text-xs">
              {Object.entries(o.split).map(([k, v]) => (
                <span key={k} className="rounded-full bg-[#f6f8fd] px-2 py-1 font-semibold">
                  {k} {v}
                </span>
              ))}
            </div>
            <p className="mt-2 text-xs text-muted">
              Roster points: {points.filter((p) => p.openingId === o.id).map((p) => `${p.category}→${p.nextPoint}`).join(" · ") || "—"}
            </p>
            {/* Stage moves live on the pipeline board above; here only onboarding for offers and joiners. */}
            <ul className="mt-4 space-y-2">
              {candidates
                .filter((c) => c.openingId === o.id && (c.stage === "offer" || c.stage === "joined"))
                .map((c) => (
                  <li key={c.id}>
                    <ExpandableCard
                      icon={<IdentificationBadge size={20} weight="duotone" />}
                      title={`Onboarding · ${c.name}`}
                      subtitle={`${o.post} · ${o.grade}`}
                      items={c.checklist.map((item) => ({
                        label: item.item,
                        done: item.done,
                        onToggle:
                          canEdit && !item.done
                            ? () => {
                                tickOnboarding(c.id, item.item);
                                toast.success(`${item.item} done for ${c.name}.`);
                              }
                            : undefined,
                      }))}
                      priority={{ label: "Joining this month", tone: "danger" }}
                      status={{
                        label: c.stage === "joined" ? "Joined" : c.checklist.every((x) => x.done) ? "Ready to join" : "In progress",
                        tone: c.stage === "joined" ? "ok" : c.checklist.every((x) => x.done) ? "brand" : "warn",
                      }}
                      people={[c.name, me?.name].filter((n): n is string => !!n)}
                    />
                  </li>
                ))}
            </ul>
            <FileDownloadList className="mt-1">
              <FileDownload
                kind="xls"
                name="RTI selection record"
                size={prettySize(
                  [`${o.post}`, ...candidates.filter((c) => c.openingId === o.id).map((c) => `${c.name},${c.category},${c.score},${c.stage}`)].join("\n"),
                )}
                onClick={() =>
                  downloadText(
                    `rti-${o.id}.csv`,
                    [`${o.post}`, ...candidates.filter((c) => c.openingId === o.id).map((c) => `${c.name},${c.category},${c.score},${c.stage}`)].join("\n"),
                  )
                }
              />
            </FileDownloadList>
          </Card>
        ))}
      </div>
    </div>
  );
}

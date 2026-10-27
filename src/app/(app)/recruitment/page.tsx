"use client";

import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { downloadText } from "@/lib/files";
import { useHrms } from "@/lib/store";
import type { CandidateStage } from "@/lib/types";
import { toast } from "sonner";

const FLOW: CandidateStage[] = ["applied", "shortlist", "interview", "medical", "offer", "joined"];

export default function RecruitmentPage() {
  const openings = useHrms((s) => s.openings);
  const candidates = useHrms((s) => s.candidates);
  const points = useHrms((s) => s.rosterPoints);
  const moveCandidate = useHrms((s) => s.moveCandidate);
  const tickOnboarding = useHrms((s) => s.tickOnboarding);
  const joinCandidate = useHrms((s) => s.joinCandidate);

  return (
    <div>
      <PageHeader
        title="Recruitment"
        subtitle="Reservation roster per opening. Joining writes the candidate into the employee record with no re-entry."
      />
      <div className="grid gap-4">
        {openings.map((o) => (
          <Card key={o.id} className="p-5">
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
            <ul className="mt-4 space-y-2">
              {candidates
                .filter((c) => c.openingId === o.id)
                .map((c) => {
                  const idx = FLOW.indexOf(c.stage);
                  const next = FLOW[idx + 1];
                  return (
                    <li key={c.id} className="rounded-xl bg-[#f6f8fd] px-3 py-3 text-sm">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span>
                          {c.name} · {c.category}
                          {c.gateScore ? ` · GATE ${c.gateScore}` : ""}
                        </span>
                        <span className="flex items-center gap-2">
                          <span className="text-muted">{c.stage}</span>
                          {next && next !== "joined" && (
                            <button className="text-xs font-semibold text-brand" onClick={() => moveCandidate(c.id, next)}>
                              Move to {next}
                            </button>
                          )}
                          {c.stage === "offer" && (
                            <Button
                              onClick={() => {
                                const r = joinCandidate(c.id);
                                if (!r.ok) toast.error(r.reason);
                                else toast.success("Employee record created");
                              }}
                            >
                              Join
                            </Button>
                          )}
                        </span>
                      </div>
                      {(c.stage === "offer" || c.stage === "joined") && (
                        <div className="mt-2 flex flex-wrap gap-2">
                          {c.checklist.map((item) => (
                            <button
                              key={item.item}
                              onClick={() => tickOnboarding(c.id, item.item)}
                              className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${item.done ? "bg-[#e7f8ef] text-[#0f9f6e]" : "bg-white text-muted"}`}
                            >
                              {item.item}
                            </button>
                          ))}
                        </div>
                      )}
                    </li>
                  );
                })}
            </ul>
            <button
              className="mt-3 text-xs font-semibold text-brand"
              onClick={() =>
                downloadText(
                  `rti-${o.id}.txt`,
                  [`${o.post}`, ...candidates.filter((c) => c.openingId === o.id).map((c) => `${c.name},${c.category},${c.score},${c.stage}`)].join("\n"),
                )
              }
            >
              RTI selection record
            </button>
          </Card>
        ))}
      </div>
    </div>
  );
}

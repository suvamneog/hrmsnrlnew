"use client";

import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { HoldToConfirm } from "@/components/ui/hold-to-confirm";
import { cn } from "@/lib/cn";
import { CRITERIA, useDesk } from "@/lib/desk";
import { formatDay, formatStamp } from "@/lib/format";
import { useHrms } from "@/lib/store";
import type { Candidate, CandidateStage } from "@/lib/types";
import { Check, ChatsCircle, Envelope, FileText, FirstAid, IdentificationBadge, ListChecks } from "@phosphor-icons/react";
import { useState } from "react";
import { toast } from "sonner";

const STEPS: { id: CandidateStage; label: string; icon: React.ElementType; action: string }[] = [
  { id: "applied", label: "Applied", icon: FileText, action: "Shortlist" },
  { id: "shortlist", label: "Shortlisted", icon: ListChecks, action: "Call for interview" },
  { id: "interview", label: "Interview", icon: ChatsCircle, action: "Send for medical" },
  { id: "medical", label: "Medical", icon: FirstAid, action: "Issue offer" },
  { id: "offer", label: "Offer", icon: Envelope, action: "Join" },
  { id: "joined", label: "Joined", icon: IdentificationBadge, action: "" },
];

type Interview = { candidateId: string; at: string; scores: Record<string, number>; offerAt?: string };

/* What a step means for this candidate, as one plain line. */
function stepDetail(c: Candidate, stage: CandidateStage, interviews: Interview[]) {
  const iv = interviews.find((i) => i.candidateId === c.id);
  const total = iv ? CRITERIA.reduce((n, k) => n + (iv.scores[k] ?? 0), 0) : 0;
  const at = STEPS.findIndex((s) => s.id === c.stage);
  const i = STEPS.findIndex((s) => s.id === stage);
  const reached = i <= at;
  const left = c.checklist.filter((x) => !x.done).length;
  switch (stage) {
    case "applied":
      return c.gateScore ? `Applied with GATE score ${c.gateScore}.` : "Application received.";
    case "shortlist":
      return reached ? `Merit score ${c.score}, ${c.category} category.` : "Not on the merit list yet.";
    case "interview":
      if (!iv) return reached ? "Interview not scheduled yet." : "Panel interview with two officers.";
      return total ? `Panel scored ${total} of 30 on ${formatDay(iv.at.slice(0, 10))}.` : `Scheduled ${formatStamp(iv.at)}.`;
    case "medical":
      if (c.checklist.find((x) => x.item === "Medical")?.done) return "Medical fitness cleared at NRL hospital.";
      return reached ? "Medical at NRL hospital is pending." : "Pre-employment medical at NRL hospital.";
    case "offer":
      if (iv?.offerAt) return `Offer letter issued ${formatDay(iv.offerAt.slice(0, 10))}.`;
      return reached ? (left ? `Offer out, ${left} onboarding items left.` : "Offer out, ready to join.") : "Offer letter after medical.";
    case "joined":
      return c.stage === "joined" ? "Joined. Employee record created." : "Joins once onboarding is complete.";
  }
}

/* Every candidate's journey on one line. The current step's detail is always written out
   under the track; tapping any other step shows its detail there instead, so nothing needs hover. */
export function PipelineBoard() {
  const candidates = useHrms((s) => s.candidates);
  const openings = useHrms((s) => s.openings);
  const role = useHrms((s) => s.actingRole);
  const moveCandidate = useHrms((s) => s.moveCandidate);
  const joinCandidate = useHrms((s) => s.joinCandidate);
  const interviews = useDesk((d) => d.interviews);
  const [opening, setOpening] = useState("all");
  const [picked, setPicked] = useState<Record<string, CandidateStage>>({});
  const canEdit = role === "recruiter" || role === "hr_admin";

  const pool = candidates.filter((c) => opening === "all" || c.openingId === opening);
  const list = [...pool].sort((a, b) => STEPS.findIndex((s) => s.id === b.stage) - STEPS.findIndex((s) => s.id === a.stage));
  const post = (id: string) => openings.find((o) => o.id === id)?.post ?? "";
  const counts = STEPS.map((s) => ({ ...s, n: pool.filter((c) => c.stage === s.id).length }));

  return (
    <section className="mb-6 rounded-xl border border-line bg-white">
      <header className="flex flex-wrap items-end justify-between gap-3 px-5 pt-5 sm:px-6">
        <div>
          <h2 className="text-[16px] font-semibold tracking-tight text-ink">Hiring pipeline</h2>
          <p className="mt-1 text-[13px] text-muted">
            {pool.length} candidates, {pool.filter((c) => c.stage !== "joined").length} still to join.
          </p>
        </div>
        <div className="-mx-1 flex max-w-full gap-1 overflow-x-auto px-1 [scrollbar-width:none]">
          {[{ id: "all", post: "All posts" }, ...openings].map((o) => (
            <button
              key={o.id}
              type="button"
              aria-pressed={opening === o.id}
              onClick={() => setOpening(o.id)}
              className={cn(
                "shrink-0 rounded-lg px-3 py-1.5 text-[13px] transition-colors",
                opening === o.id ? "bg-[#f0f0ee] font-medium text-ink" : "text-muted hover:text-ink",
              )}
            >
              {o.post}
            </button>
          ))}
        </div>
      </header>

      {/* Count per stage, readable at a glance on any device. */}
      <dl className="mt-5 grid grid-cols-3 border-y border-line sm:grid-cols-6">
        {counts.map((s, i) => (
          <div
            key={s.id}
            className={cn(
              "px-4 py-3 sm:px-5",
              i % 3 !== 0 && "border-l border-line",
              i % 6 !== 0 && "sm:border-l",
              i >= 3 && "border-t border-line sm:border-t-0",
            )}
          >
            <dt className="text-[12px] text-muted">{s.label}</dt>
            <dd className="mt-0.5 text-[20px] font-semibold tabular-nums text-ink">{s.n}</dd>
          </div>
        ))}
      </dl>

      <ul className="divide-y divide-line px-5 sm:px-6">
        {list.map((c) => {
          const at = STEPS.findIndex((s) => s.id === c.stage);
          const next = STEPS[at + 1];
          const show = picked[c.id] ?? c.stage;
          const shown = STEPS.find((s) => s.id === show)!;
          return (
            <li key={c.id} className="py-4">
              <div className="flex items-start gap-3">
                <Avatar name={c.name} size={40} />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-2">
                    <div className="min-w-0">
                      <p className="truncate text-[15px] font-medium text-ink">{c.name}</p>
                      <p className="truncate text-[13px] text-muted">
                        {post(c.openingId)}, {c.category}
                        {c.gateScore ? `, GATE ${c.gateScore}` : ""}
                      </p>
                    </div>
                    {canEdit && next && c.stage !== "offer" && (
                      <Button
                        variant="secondary"
                        className="h-8 px-3 text-[13px]"
                        onClick={() => {
                          moveCandidate(c.id, next.id);
                          setPicked((p) => ({ ...p, [c.id]: next.id }));
                          toast.success(`${c.name} moved to ${next.label.toLowerCase()}`);
                        }}
                      >
                        {STEPS[at].action}
                      </Button>
                    )}
                    {canEdit && c.stage === "offer" && (
                      <HoldToConfirm
                        label={`Hold to join ${c.name.split(" ")[0]}`}
                        doneLabel="Joined"
                        onConfirm={() => {
                          const r = joinCandidate(c.id);
                          if (!r.ok) toast.error(r.reason);
                          else toast.success(`${c.name} joined. Employee record created.`);
                        }}
                      />
                    )}
                  </div>

                  <ol className="mt-3 flex items-center overflow-x-auto [scrollbar-width:none]" aria-label={`${c.name}, stage ${at + 1} of ${STEPS.length}`}>
                    {STEPS.map((s, i) => {
                      const done = i < at || c.stage === "joined";
                      const current = i === at && c.stage !== "joined";
                      const Icon = s.icon;
                      return (
                        <li key={s.id} className="flex shrink-0 items-center">
                          {i > 0 && <span className={cn("mx-1 block h-px w-4 sm:w-6", i <= at ? "bg-[#148f5b]" : "bg-line")} />}
                          <button
                            type="button"
                            onClick={() => setPicked((p) => ({ ...p, [c.id]: s.id }))}
                            aria-pressed={show === s.id}
                            aria-label={`${s.label}, ${done ? "done" : current ? "current" : "upcoming"}`}
                            className={cn(
                              "grid h-8 w-8 place-items-center rounded-full border transition-colors",
                              done && "border-[#148f5b] bg-[#eaf6ef] text-[#148f5b]",
                              current && "border-brand bg-brand-soft text-brand",
                              !done && !current && "border-line bg-white text-[#a1a1a6]",
                              show === s.id && "ring-2 ring-ink/15 ring-offset-1",
                            )}
                          >
                            {done ? <Check size={14} weight="bold" /> : <Icon size={15} />}
                          </button>
                        </li>
                      );
                    })}
                    <li className="ml-3 shrink-0 text-[13px] tabular-nums text-muted">
                      {at + 1} of {STEPS.length}
                    </li>
                  </ol>

                  <p className="mt-2 text-[13px] text-ink">
                    <span className="font-medium">{shown.label}.</span>{" "}
                    <span className="text-muted">{stepDetail(c, show, interviews)}</span>
                  </p>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
      {list.length === 0 && <p className="py-8 text-center text-sm text-muted">No candidates for this post yet.</p>}
    </section>
  );
}

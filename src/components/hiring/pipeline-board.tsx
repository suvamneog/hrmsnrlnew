"use client";

import { HoldToConfirm } from "@/components/ui/hold-to-confirm";
import { Avatar } from "@/components/ui/avatar";
import { cn } from "@/lib/cn";
import { easeOut, spring } from "@/lib/motion";
import { useDesk, CRITERIA } from "@/lib/desk";
import { formatDay, formatStamp } from "@/lib/format";
import { useHrms } from "@/lib/store";
import type { Candidate, CandidateStage } from "@/lib/types";
import {
  ArrowRight,
  Bell,
  ChatsCircle,
  Check,
  Envelope,
  FileText,
  FirstAid,
  IdentificationBadge,
  ListChecks,
} from "@phosphor-icons/react";
import { AnimatePresence, LayoutGroup, motion, useReducedMotion } from "motion/react";
import { useState } from "react";
import { createPortal } from "react-dom";
import { toast } from "sonner";

const STEPS: { id: CandidateStage; label: string; icon: React.ElementType; action: string }[] = [
  { id: "applied", label: "Applied", icon: FileText, action: "Shortlist" },
  { id: "shortlist", label: "Shortlisted", icon: ListChecks, action: "Call for interview" },
  { id: "interview", label: "Interview", icon: ChatsCircle, action: "Send for medical" },
  { id: "medical", label: "Medical", icon: FirstAid, action: "Issue offer" },
  { id: "offer", label: "Offer", icon: Envelope, action: "Join" },
  { id: "joined", label: "Joined", icon: IdentificationBadge, action: "" },
];

/* What a step means for this candidate, in one line for the hover card. */
function stepDetail(
  c: Candidate,
  stage: CandidateStage,
  done: boolean,
  current: boolean,
  interviews: { candidateId: string; at: string; scores: Record<string, number>; offerAt?: string }[],
) {
  const iv = interviews.find((i) => i.candidateId === c.id);
  const total = iv ? CRITERIA.reduce((n, k) => n + (iv.scores[k] ?? 0), 0) : 0;
  const medical = c.checklist.find((x) => x.item === "Medical")?.done;
  const left = c.checklist.filter((x) => !x.done).length;
  switch (stage) {
    case "applied":
      return c.gateScore ? `Applied with GATE score ${c.gateScore}.` : "Application received.";
    case "shortlist":
      return done || current ? `Merit score ${c.score}, ${c.category} category.` : "Waiting for the merit list.";
    case "interview":
      if (!iv) return current ? "Interview not scheduled yet." : "Panel interview with two officers.";
      if (total) return `Panel scored ${total} of 30 on ${formatDay(iv.at.slice(0, 10))}.`;
      return `Scheduled ${formatStamp(iv.at)}.`;
    case "medical":
      return medical ? "Medical fitness cleared." : current ? "Medical at the NRL hospital is pending." : "Pre-employment medical at NRL hospital.";
    case "offer":
      if (iv?.offerAt) return `Offer letter issued ${formatDay(iv.offerAt.slice(0, 10))}.`;
      return done ? "Offer accepted." : current ? `Offer out. ${left ? `${left} onboarding items left.` : "Ready to join."}` : "Offer letter after medical.";
    case "joined":
      return done ? "Joined. Employee record created." : "Joins once onboarding is complete.";
  }
}

/* Every candidate's whole journey on one line, from application to joining.
   Done steps turn green with a tick, the current step is ringed, and the arrow moves them on. */
export function PipelineBoard() {
  const candidates = useHrms((s) => s.candidates);
  const openings = useHrms((s) => s.openings);
  const role = useHrms((s) => s.actingRole);
  const moveCandidate = useHrms((s) => s.moveCandidate);
  const joinCandidate = useHrms((s) => s.joinCandidate);
  const reduce = useReducedMotion();
  const [opening, setOpening] = useState<string>("all");
  const [hover, setHover] = useState<{ key: string; x: number; y: number } | null>(null);
  const interviews = useDesk((d) => d.interviews);
  // The step row scrolls sideways on phones, which would clip a card inside it, so the card
  // is drawn on <body> at the step's position.
  const show = (key: string, el: HTMLElement) => {
    const r = el.getBoundingClientRect();
    setHover({ key, x: r.left + r.width / 2, y: r.bottom });
  };
  const tip = (() => {
    if (!hover) return null;
    const [cid, sid] = hover.key.split(":");
    const c = candidates.find((x) => x.id === cid);
    const at = STEPS.findIndex((x) => x.id === c?.stage);
    const i = STEPS.findIndex((x) => x.id === sid);
    if (!c || i < 0) return null;
    const done = i < at || c.stage === "joined";
    const current = i === at && c.stage !== "joined";
    return { c, s: STEPS[i], done, current };
  })();
  const canEdit = role === "recruiter" || role === "hr_admin";

  const list = candidates
    .filter((c) => opening === "all" || c.openingId === opening)
    .sort((a, b) => STEPS.findIndex((s) => s.id === b.stage) - STEPS.findIndex((s) => s.id === a.stage));
  const waiting = candidates.filter((c) => c.stage !== "joined").length;
  const post = (id: string) => openings.find((o) => o.id === id)?.post ?? "";

  return (
    <section className="mb-6 rounded-[20px] border border-line bg-white p-5 sm:p-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-[16px] font-semibold tracking-tight text-ink">Hiring pipeline</h2>
          <p className="mt-1 text-[13px] text-muted">Every candidate from application to joining.</p>
        </div>
        <LayoutGroup id="pipeline-filter">
          <div className="-mx-1 flex max-w-full gap-1 overflow-x-auto px-1 [scrollbar-width:none]">
            {[{ id: "all", post: "All posts" }, ...openings].map((o) => {
              const on = opening === o.id;
              return (
                <button
                  key={o.id}
                  type="button"
                  onClick={() => setOpening(o.id)}
                  className={cn("relative shrink-0 rounded-full px-3.5 py-1.5 text-[13px] font-medium transition-colors", on ? "text-white" : "text-muted hover:text-ink")}
                >
                  {on && <motion.span layoutId="pipeline-pill" transition={spring} className="absolute inset-0 rounded-full bg-ink" />}
                  <span className="relative whitespace-nowrap">{o.post}</span>
                </button>
              );
            })}
          </div>
        </LayoutGroup>
      </header>

      {waiting > 0 && (
        <div className="mt-5 flex items-center gap-2.5 rounded-xl bg-[#fdf3f1] px-4 py-3 text-[13px] text-[#9c3d2e]">
          <Bell size={16} className="shrink-0" />
          <span className="flex-1">{waiting === 1 ? "1 candidate is still in the pipeline" : `${waiting} candidates are still in the pipeline`}</span>
        </div>
      )}

      <ul className="mt-2 divide-y divide-line">
        <AnimatePresence initial={false}>
          {list.map((c, row) => {
            const at = STEPS.findIndex((s) => s.id === c.stage);
            const pct = Math.round(((at + 1) / STEPS.length) * 100);
            const step = STEPS[at];
            const next = STEPS[at + 1];
            return (
              <motion.li
                key={c.id}
                layout="position"
                initial={reduce ? false : { opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.45, ease: easeOut, delay: reduce ? 0 : row * 0.04 }}
                className="py-5"
              >
                <div className="flex items-start gap-3.5">
                  <Avatar name={c.name} size={44} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-[15px] font-semibold text-ink">{c.name}</p>
                        <p className="truncate text-[13px] text-muted">
                          {post(c.openingId)}, {c.category}
                          {c.gateScore ? `, GATE ${c.gateScore}` : ""}
                        </p>
                      </div>
                      {canEdit && next && c.stage !== "offer" && (
                        <motion.button
                          type="button"
                          whileHover={reduce ? undefined : { x: 2 }}
                          whileTap={reduce ? undefined : { scale: 0.9 }}
                          transition={spring}
                          title={step.action}
                          aria-label={`${step.action}: ${c.name}`}
                          onClick={() => {
                            moveCandidate(c.id, next.id);
                            toast.success(`${c.name} moved to ${next.label.toLowerCase()}`);
                          }}
                          className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-brand transition-colors hover:bg-brand-soft"
                        >
                          <ArrowRight size={18} weight="bold" />
                        </motion.button>
                      )}
                    </div>

                    <div className="mt-4 flex items-center gap-3">
                      <ol className="flex min-w-0 flex-1 items-center overflow-x-auto pb-1 [scrollbar-width:none]">
                        {STEPS.map((s, i) => {
                          const done = i < at || c.stage === "joined";
                          const current = i === at && c.stage !== "joined";
                          const Icon = s.icon;
                          return (
                            <li key={s.id} className="flex shrink-0 items-center">
                              {i > 0 && (
                                <span className="relative mx-1 block h-[2px] w-5 overflow-hidden rounded-full bg-[#e5e5e3] sm:w-8">
                                  <motion.span
                                    className="absolute inset-0 origin-left rounded-full bg-[#2fa36b]"
                                    initial={false}
                                    animate={{ scaleX: i <= at ? 1 : 0 }}
                                    transition={{ duration: reduce ? 0 : 0.5, ease: easeOut, delay: reduce ? 0 : i * 0.06 }}
                                  />
                                </span>
                              )}
                              <span
                                className="relative outline-none"
                                tabIndex={0}
                                aria-label={`${s.label}: ${done ? "done" : current ? "current step" : "upcoming"}`}
                                onPointerEnter={(e) => show(`${c.id}:${s.id}`, e.currentTarget)}
                                onPointerLeave={() => setHover(null)}
                                onFocus={(e) => show(`${c.id}:${s.id}`, e.currentTarget)}
                                onBlur={() => setHover(null)}
                              >
                                <motion.span
                                  initial={false}
                                  animate={{ scale: current ? 1.06 : 1 }}
                                  transition={spring}
                                  className={cn(
                                    "relative grid h-9 w-9 place-items-center rounded-full border-2 transition-colors duration-500",
                                    done && "border-[#2fa36b] bg-[#eefaf3] text-[#1f8a56]",
                                    current && "border-brand bg-white text-brand",
                                    !done && !current && "border-[#e5e5e3] bg-[#fafaf9] text-[#a1a1a6]",
                                  )}
                                >
                                  <Icon size={16} weight={done || current ? "fill" : "regular"} />
                                  {current && !reduce && (
                                    <motion.span
                                      className="absolute inset-[-5px] rounded-full border border-brand/40"
                                      animate={{ scale: [1, 1.18], opacity: [0.6, 0] }}
                                      transition={{ duration: 1.8, repeat: Infinity, ease: "easeOut" }}
                                    />
                                  )}
                                  <AnimatePresence>
                                    {done && (
                                      <motion.span
                                        initial={reduce ? false : { scale: 0 }}
                                        animate={{ scale: 1 }}
                                        exit={{ scale: 0 }}
                                        transition={spring}
                                        className="absolute -right-1 -top-1 grid h-4 w-4 place-items-center rounded-full bg-brand text-white ring-2 ring-white"
                                      >
                                        <Check size={9} weight="bold" />
                                      </motion.span>
                                    )}
                                  </AnimatePresence>
                                </motion.span>

                              </span>
                            </li>
                          );
                        })}
                      </ol>
                      <span className="w-10 shrink-0 text-right text-[13px] font-medium tabular-nums text-muted">{pct}%</span>
                    </div>

                    <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                      <p className="text-[12px] text-muted">
                        {c.stage === "joined" ? "Joined and on the rolls" : `At ${step.label.toLowerCase()}${next ? `, next ${next.label.toLowerCase()}` : ""}`}
                      </p>
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
                  </div>
                </div>
              </motion.li>
            );
          })}
        </AnimatePresence>
      </ul>
      {list.length === 0 && <p className="py-8 text-center text-sm text-muted">No candidates for this post yet.</p>}
      {typeof document !== "undefined" &&
        createPortal(
          <AnimatePresence>
            {hover && tip && (
              <motion.div
                key={hover.key}
                role="tooltip"
                initial={{ opacity: 0, y: -4, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -4, scale: 0.96 }}
                transition={{ duration: 0.18, ease: easeOut }}
                style={{ left: Math.min(Math.max(hover.x, 124), window.innerWidth - 124), top: hover.y + 10 }}
                className="pointer-events-none fixed z-[70] w-56 -translate-x-1/2 rounded-xl bg-white p-3 text-left shadow-[0_12px_32px_rgba(0,0,0,0.12)] ring-1 ring-line"
              >
                <span className="flex items-center justify-between gap-2">
                  <span className="text-[13px] font-semibold text-ink">{tip.s.label}</span>
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-[11px] font-medium",
                      tip.done ? "bg-[#eefaf3] text-[#1f8a56]" : tip.current ? "bg-brand-soft text-brand" : "bg-[#f2f2f0] text-muted",
                    )}
                  >
                    {tip.done ? "Done" : tip.current ? "Current step" : "Upcoming"}
                  </span>
                </span>
                <span className="mt-1.5 block text-[12px] leading-relaxed text-muted">{stepDetail(tip.c, tip.s.id, tip.done, tip.current, interviews)}</span>
              </motion.div>
            )}
          </AnimatePresence>,
          document.body,
        )}

    </section>
  );
}

"use client";

import { Collapse, Field, Grid2, Panel, Pill, Rows, Stats } from "@/components/desk/kit";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Input, Select, Textarea } from "@/components/ui/input";
import { CASE_LABEL, type CaseItem, type CaseKind, type CaseStatus, useDesk } from "@/lib/desk";
import { formatStamp } from "@/lib/format";
import { useCurrentUser, useHrms } from "@/lib/store";
import { useState } from "react";
import { toast } from "sonner";

const STATUS: Record<CaseStatus, { label: string; tone: "warn" | "brand" | "ok" }> = {
  open: { label: "Open", tone: "warn" },
  in_progress: { label: "In progress", tone: "brand" },
  resolved: { label: "Resolved", tone: "ok" },
};

// Discipline and medical cases stay between the person, their raiser and HR.
const PRIVATE: CaseKind[] = ["discipline", "medical"];

export default function CasesPage() {
  const me = useCurrentUser();
  const role = useHrms((s) => s.actingRole);
  const employees = useHrms((s) => s.employees);
  const cases = useDesk((s) => s.cases);
  const raise = useDesk((s) => s.raiseCase);
  const move = useDesk((s) => s.moveCase);
  const [kind, setKind] = useState<CaseKind>("helpdesk");
  const [subject, setSubject] = useState("");
  const [detail, setDetail] = useState("");
  const [filter, setFilter] = useState<CaseKind | "all">("all");
  const [open, setOpen] = useState<string | null>(null);
  const [reply, setReply] = useState("");
  if (!me) return null;

  const hr = role === "hr_admin";
  const auditor = role === "auditor";
  const kinds: CaseKind[] = role === "line_manager" || hr ? ["helpdesk", "grievance", "discipline", "transfer", "medical"] : ["helpdesk", "grievance", "transfer", "medical"];
  const visible = cases.filter((c) => (hr || auditor ? true : c.raisedBy === me.id)).filter((c) => filter === "all" || c.kind === filter);
  const name = (id: string) => employees.find((e) => e.id === id)?.name ?? id;

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (subject.trim().length < 6) return toast.error("Say in a few words what the case is about.");
    raise({ kind, raisedBy: me!.id, subject: subject.trim(), detail: detail.trim(), confidential: PRIVATE.includes(kind) });
    toast.success(`${CASE_LABEL[kind]} case raised with HR`);
    setSubject("");
    setDetail("");
  }

  function decide(c: CaseItem, status: CaseStatus) {
    move(c.id, status, me!.id, reply.trim() || (status === "resolved" ? "Resolved." : "Picked up by HR."));
    setReply("");
    toast.success(`Case marked ${STATUS[status].label.toLowerCase()}`);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={hr ? "Cases" : "Help and cases"}
        subtitle={hr ? "Helpdesk, grievance, discipline, transfer and medical cases in one queue." : "Ask HR for help, raise a grievance or request a transfer."}
      />

      {(hr || auditor) && (
        <Stats
          items={[
            { label: "Open", value: cases.filter((c) => c.status === "open").length, tone: "warn" },
            { label: "In progress", value: cases.filter((c) => c.status === "in_progress").length },
            { label: "Resolved", value: cases.filter((c) => c.status === "resolved").length, tone: "ok" },
            { label: "Confidential", value: cases.filter((c) => c.confidential).length, hint: "Discipline and medical" },
          ]}
        />
      )}

      <Grid2 className="xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <Panel
          title={hr || auditor ? "Queue" : "Your cases"}
          action={
            <Select value={filter} onChange={(e) => setFilter(e.target.value as CaseKind | "all")} className="h-9 w-auto">
              <option value="all">All kinds</option>
              {kinds.map((k) => (
                <option key={k} value={k}>
                  {CASE_LABEL[k]}
                </option>
              ))}
            </Select>
          }
        >
          <Rows
            items={visible}
            empty="No cases here."
            render={(c) => (
              <div className="w-full">
                <button type="button" onClick={() => setOpen(open === c.id ? null : c.id)} className="flex w-full items-start justify-between gap-4 text-left">
                  <span className="min-w-0">
                    <span className="block text-sm font-medium text-ink">{c.subject}</span>
                    <span className="mt-0.5 block text-[12px] text-muted">
                      {CASE_LABEL[c.kind]}, {hr || auditor ? `${name(c.raisedBy)}, ` : ""}
                      {formatStamp(c.at)}
                    </span>
                  </span>
                  <span className="flex shrink-0 gap-1.5">
                    {c.confidential && <Pill>Confidential</Pill>}
                    <Pill tone={STATUS[c.status].tone}>{STATUS[c.status].label}</Pill>
                  </span>
                </button>
                <Collapse open={open === c.id}>
                  <div className="mt-3 space-y-3 border-t border-[#eef0f6] pt-3">
                    {c.detail && <p className="text-[13px] text-ink/80">{c.detail}</p>}
                    {c.updates.map((u) => (
                      <p key={u.at} className="text-[13px] text-muted">
                        <span className="font-medium text-ink">{name(u.by)}</span>, {formatStamp(u.at)}: {u.text}
                      </p>
                    ))}
                    {hr && c.status !== "resolved" && (
                      <div className="space-y-3">
                        <Textarea rows={2} placeholder="Note for the employee" value={reply} onChange={(e) => setReply(e.target.value)} />
                        <div className="flex flex-wrap gap-2">
                          {c.status === "open" && (
                            <Button variant="secondary" onClick={() => decide(c, "in_progress")}>
                              Pick up
                            </Button>
                          )}
                          <Button onClick={() => decide(c, "resolved")}>Resolve</Button>
                        </div>
                      </div>
                    )}
                  </div>
                </Collapse>
              </div>
            )}
          />
        </Panel>

        {!auditor && (
          <Panel title="Raise a case" note="HR replies here. Discipline and medical cases are confidential.">
            <form onSubmit={submit} className="grid gap-4">
              <Field label="Kind">
                <Select value={kind} onChange={(e) => setKind(e.target.value as CaseKind)}>
                  {kinds.map((k) => (
                    <option key={k} value={k}>
                      {CASE_LABEL[k]}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Subject">
                <Input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Night shift allowance short paid" />
              </Field>
              <Field label="Details">
                <Textarea rows={4} value={detail} onChange={(e) => setDetail(e.target.value)} placeholder="Dates, amounts, who you spoke to" />
              </Field>
              <div>
                <Button type="submit">Raise case</Button>
              </div>
            </form>
          </Panel>
        )}
      </Grid2>
    </div>
  );
}

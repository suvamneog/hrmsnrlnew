"use client";

import { PageHeader } from "@/components/layout/page-header";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, Input } from "@/components/ui/input";
import { downloadText, oshReturn } from "@/lib/files";
import { maskAadhaar } from "@/lib/format";
import { daysToLicence, passBlockReason } from "@/lib/gate";
import { useCurrentUser, useHrms } from "@/lib/store";
import { useState } from "react";
import { toast } from "sonner";

export default function ContractorsPage() {
  const me = useCurrentUser();
  const role = useHrms((s) => s.actingRole);
  const contractorsAll = useHrms((s) => s.contractors);
  const workers = useHrms((s) => s.workers);
  const certs = useHrms((s) => s.certificates);
  const events = useHrms((s) => s.gateEvents);
  const passes = useHrms((s) => s.passes);
  const proofs = useHrms((s) => s.wageProofs);
  const registerWorker = useHrms((s) => s.registerWorker);
  const bulkOnboard = useHrms((s) => s.bulkOnboard);
  const blacklistWorker = useHrms((s) => s.blacklistWorker);
  const uploadWageProof = useHrms((s) => s.uploadWageProof);
  const [name, setName] = useState("");
  const [skill, setSkill] = useState("");
  const contractors =
    role === "contractor_supervisor"
      ? contractorsAll.filter((c) => c.supervisorId === me?.id || c.id === me?.contractorId)
      : contractorsAll;

  return (
    <div>
      <PageHeader title="Contract labour" subtitle="Licence tracking, worker register, wage proofs. A pass is issued only when every mandatory check is valid." />
      <div className="grid gap-4">
        {contractors.map((c) => {
          const crew = workers.filter((w) => w.contractorId === c.id);
          const days = daysToLicence(c.licenceExpiry);
          const inside = crew.filter((w) => {
            const last = events.find((e) => passes.find((p) => p.id === e.passId)?.workerId === w.id);
            return last?.direction === "in";
          }).length;
          return (
            <Card key={c.id} className="p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="font-semibold">{c.name}</h2>
                  <p className="text-sm text-muted">
                    {c.workOrder} · {c.area} · PF {c.pfCode} · {inside} in plant
                  </p>
                </div>
                <Badge tone={days < 45 ? "danger" : "ok"}>Licence {c.licenceExpiry} · {days}d</Badge>
              </div>
              {(role === "contract_labour_cell" || role === "contractor_supervisor") && (
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button
                    variant="secondary"
                    onClick={() => {
                      const n = bulkOnboard(c.id, 12);
                      toast.success(`Onboarded ${n} of 300 shutdown workers`);
                    }}
                  >
                    Shutdown batch (12)
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => {
                      uploadWageProof(c.id, "2026-10", `wage_${c.id}_Oct.pdf`);
                      toast.success("Wage proof filed");
                    }}
                  >
                    Upload wage proof
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() =>
                      downloadText(
                        `OSH_${c.id}_2026-10.txt`,
                        oshReturn("2026-10", c, crew.length, inside),
                      )
                    }
                  >
                    OSH return
                  </Button>
                </div>
              )}
              {proofs.filter((p) => p.contractorId === c.id).map((p) => (
                <p key={p.id} className="mt-2 text-xs text-muted">
                  Wage proof {p.month}: {p.fileName}
                </p>
              ))}
              <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {crew.map((w) => {
                  const reason = passBlockReason({ worker: w, contractor: c, certs });
                  return (
                    <div key={w.id} className="flex items-center gap-3 rounded-2xl bg-[#f6f8fd] p-3">
                      <Avatar name={w.name} size={40} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold">{w.name}</p>
                        <p className="text-xs text-muted">
                          {w.skill} · {maskAadhaar(w.aadhaar)}
                        </p>
                        <Badge tone={reason ? "danger" : "ok"}>{reason ?? "Pass live"}</Badge>
                        {role === "contract_labour_cell" && !w.blacklisted && (
                          <button
                            className="mt-1 block text-[11px] font-semibold text-[#d13b3b]"
                            onClick={() => {
                              const r = blacklistWorker(w.id, "Safety violation");
                              if (!r.ok) toast.error(r.reason);
                              else toast.success("Blacklisted");
                            }}
                          >
                            Blacklist
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          );
        })}
      </div>
      {role === "contract_labour_cell" && contractors[0] && (
        <Card className="mt-5 grid gap-3 p-5 sm:grid-cols-3">
          <Field label="Register worker">
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" />
          </Field>
          <Field label="Skill">
            <Input value={skill} onChange={(e) => setSkill(e.target.value)} placeholder="Skill" />
          </Field>
          <div className="flex items-end">
            <Button
              onClick={() => {
                if (!name.trim() || !skill.trim()) {
                  toast.error("Name and skill are required.");
                  return;
                }
                registerWorker({
                  contractorId: contractors[0].id,
                  name: name.trim(),
                  skill: skill.trim(),
                  aadhaar: "000000000000",
                  uan: "101000000000",
                  esic: "2211000000",
                  policeVerification: true,
                  medicalFitnessExpiry: "2027-04-01",
                  photoSeed: name,
                  inductionPassed: false,
                });
                toast.success("Worker on register. Induction still required.");
                setName("");
                setSkill("");
              }}
            >
              Register
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}

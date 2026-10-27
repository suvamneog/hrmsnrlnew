"use client";

import { PageHeader } from "@/components/layout/page-header";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DropZone } from "@/components/ui/drop-zone";
import { FileDownload, FileDownloadList } from "@/components/ui/file-download";
import { HoldToConfirm } from "@/components/ui/hold-to-confirm";
import { DatePicker } from "@/components/ui/date-picker";
import { Field, Input, Select } from "@/components/ui/input";
import { downloadText, oshReturn, prettySize } from "@/lib/files";
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
  const [aadhaar, setAadhaar] = useState("");
  const [uan, setUan] = useState("");
  const [esic, setEsic] = useState("");
  const [medical, setMedical] = useState("");
  const [police, setPolice] = useState(false);
  const [contractorId, setContractorId] = useState(contractorsAll[0]?.id ?? "");
  const contractors =
    role === "contractor_supervisor"
      ? contractorsAll.filter((c) => c.supervisorId === me?.id || c.id === me?.contractorId)
      : contractorsAll;

  return (
    <div>
      <PageHeader title="Contract labour" />
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
                <>
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
                    <div className="min-w-[220px] flex-1">
                      <DropZone
                        label="Wage proof"
                        hint="Drop October PF / wage file"
                        files={[]}
                        onFiles={(files) => {
                          uploadWageProof(c.id, "2026-10", files[0]?.name ?? `wage_${c.id}_Oct.pdf`);
                          toast.success("Wage proof filed");
                        }}
                      />
                    </div>
                  </div>
                  <FileDownloadList>
                    <FileDownload
                      kind="txt"
                      name="OSH return"
                      size={prettySize(oshReturn("2026-10", c, crew.length, inside))}
                      onClick={() =>
                        downloadText(`OSH_${c.id}_2026-10.txt`, oshReturn("2026-10", c, crew.length, inside))
                      }
                    />
                  </FileDownloadList>
                </>
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
                          <HoldToConfirm
                            className="mt-2 h-8 min-w-0 px-3 text-[11px]"
                            variant="danger"
                            label="Hold to blacklist"
                            doneLabel="Barred"
                            onConfirm={() => {
                              const r = blacklistWorker(w.id, "Safety violation");
                              if (!r.ok) toast.error(r.reason);
                              else toast.success("Blacklisted");
                            }}
                          />
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
        <Card className="mt-5 grid gap-3 p-5 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Contractor">
            <Select value={contractorId} onChange={(e) => setContractorId(e.target.value)}>
              {contractors.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Name">
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" />
          </Field>
          <Field label="Skill">
            <Input value={skill} onChange={(e) => setSkill(e.target.value)} placeholder="Rigger, welder…" />
          </Field>
          <Field label="Aadhaar">
            <Input value={aadhaar} onChange={(e) => setAadhaar(e.target.value.replace(/\D/g, "").slice(0, 12))} inputMode="numeric" placeholder="12 digits" />
          </Field>
          <Field label="UAN">
            <Input value={uan} onChange={(e) => setUan(e.target.value.replace(/\D/g, "").slice(0, 12))} inputMode="numeric" placeholder="12 digits" />
          </Field>
          <Field label="ESIC">
            <Input value={esic} onChange={(e) => setEsic(e.target.value.replace(/\D/g, "").slice(0, 10))} inputMode="numeric" placeholder="10 digits" />
          </Field>
          <Field label="Medical fitness valid to">
            <DatePicker value={medical} onChange={setMedical} placeholder="Valid to" />
          </Field>
          <label className="flex items-center gap-2 self-end pb-2 text-sm">
            <input type="checkbox" checked={police} onChange={(e) => setPolice(e.target.checked)} />
            Police verification on file
          </label>
          <div className="flex items-end">
            <Button
              onClick={() => {
                if (!name.trim() || !skill.trim()) {
                  toast.error("Name and skill are required.");
                  return;
                }
                if (aadhaar.length !== 12) {
                  toast.error("Aadhaar must be 12 digits.");
                  return;
                }
                if (uan.length !== 12) {
                  toast.error("UAN must be 12 digits.");
                  return;
                }
                if (esic.length !== 10) {
                  toast.error("ESIC number must be 10 digits.");
                  return;
                }
                if (!medical) {
                  toast.error("Enter medical fitness expiry.");
                  return;
                }
                registerWorker({
                  contractorId: contractorId || contractors[0].id,
                  name: name.trim(),
                  skill: skill.trim(),
                  aadhaar,
                  uan,
                  esic,
                  policeVerification: police,
                  medicalFitnessExpiry: medical,
                  photoSeed: name.trim(),
                  inductionPassed: false,
                });
                toast.success("Worker on register. Induction still required.");
                setName("");
                setSkill("");
                setAadhaar("");
                setUan("");
                setEsic("");
                setMedical("");
                setPolice(false);
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

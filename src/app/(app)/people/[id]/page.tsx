"use client";

import { PageHeader } from "@/components/layout/page-header";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DatePicker } from "@/components/ui/date-picker";
import { Field, Input, Select } from "@/components/ui/input";
import { canSeePii } from "@/lib/access";
import { formatDay, maskAadhaar, maskBank, maskPan } from "@/lib/format";
import { locationName, positionTitle, unitName } from "@/lib/org";
import { cadreTone, empStatus } from "@/lib/status";
import { useHrms } from "@/lib/store";
import { useParams } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

export default function PersonPage() {
  const { id } = useParams<{ id: string }>();
  const e = useHrms((s) => s.employees.find((x) => x.id === id));
  const leaveBalances = useHrms((s) => s.leaveBalances);
  const types = useHrms((s) => s.leaveTypes);
  const quarters = useHrms((s) => s.quarters);
  const certificates = useHrms((s) => s.certificates);
  const courses = useHrms((s) => s.courses);
  const positions = useHrms((s) => s.positions);
  const role = useHrms((s) => s.actingRole);
  const revealPii = useHrms((s) => s.revealPii);
  const transferEmployee = useHrms((s) => s.transferEmployee);
  const promoteEmployee = useHrms((s) => s.promoteEmployee);
  const startSeparation = useHrms((s) => s.startSeparation);
  const [reveal, setReveal] = useState(false);
  const [positionId, setPositionId] = useState("");
  const [grade, setGrade] = useState("");
  const [basic, setBasic] = useState("");
  const [from, setFrom] = useState("2026-11-01");
  if (!e) return <p>No record.</p>;
  const balances = leaveBalances.filter((b) => b.employeeId === id);
  const certs = certificates.filter((c) => c.personId === id);
  const q = quarters.find((x) => x.id === e.quarterId);
  const canSee = canSeePii(role);

  return (
    <div>
      <PageHeader
        title={e.name}
        subtitle={`${e.empNo} · ${positionTitle(e.positionId)} · ${unitName(e.unitId)}`}
        actions={
          <div className="flex gap-2">
            <Badge tone={cadreTone(e.cadre)}>{e.cadre} · {e.grade}</Badge>
            <Badge tone={empStatus(e.status)}>{e.status}</Badge>
          </div>
        }
      />
      <div className="grid gap-5 lg:grid-cols-[280px_1fr]">
        <Card className="p-6 text-center">
          <Avatar name={e.name} size={96} className="mx-auto" />
          <p className="mt-4 font-semibold">{e.preferredName}</p>
          <p className="text-sm text-muted">{locationName(e.locationId)}</p>
          {e.crew && <p className="mt-2 text-sm">Crew {e.crew}</p>}
        </Card>
        <div className="grid gap-4">
          <Card className="p-5">
            <h2 className="mb-3 font-semibold">Identity</h2>
            <dl className="grid gap-3 sm:grid-cols-2 text-sm">
              <div>
                <dt className="text-muted">Date of joining</dt>
                <dd>{formatDay(e.doj)}</dd>
              </div>
              <div>
                <dt className="text-muted">Category</dt>
                <dd>
                  {e.category}
                  {e.pwbd ? " · PwBD" : ""}
                </dd>
              </div>
              <div>
                <dt className="text-muted">PAN</dt>
                <dd className="font-mono text-xs">{canSee && reveal ? e.pan : maskPan(e.pan)}</dd>
              </div>
              <div>
                <dt className="text-muted">Aadhaar</dt>
                <dd className="font-mono text-xs">{canSee && reveal ? e.aadhaar : maskAadhaar(e.aadhaar)}</dd>
              </div>
              <div>
                <dt className="text-muted">Bank</dt>
                <dd className="font-mono text-xs">
                  {e.ifsc} · {canSee && reveal ? e.bankAccount : maskBank(e.bankAccount)}
                </dd>
              </div>
              <div>
                <dt className="text-muted">UAN / NPS</dt>
                <dd className="font-mono text-xs">{e.uan ?? "—"} {e.npsPran ? `· ${e.npsPran}` : ""}</dd>
              </div>
            </dl>
            {canSee && (
              <button
                className="mt-3 text-xs font-semibold text-brand"
                onClick={() => {
                  if (!reveal) revealPii(e.id, "pan,aadhaar,bank");
                  setReveal((v) => !v);
                }}
              >
                {reveal ? "Mask identifiers" : "Reveal identifiers (logged)"}
              </button>
            )}
          </Card>
          <Card className="p-5">
            <h2 className="mb-3 font-semibold">Assignment history</h2>
            <ul className="space-y-2 text-sm">
              {e.assignmentHistory.map((a) => (
                <li key={a.validFrom} className="flex justify-between rounded-xl bg-[#f6f8fd] px-3 py-2">
                  <span>
                    {positionTitle(a.positionId)} · {a.grade}
                  </span>
                  <span className="text-muted">
                    from {formatDay(a.validFrom)}
                    {a.validTo ? ` to ${formatDay(a.validTo)}` : ""}
                  </span>
                </li>
              ))}
            </ul>
          </Card>
          {role === "hr_admin" && e.status !== "separated" && (
            <Card className="grid gap-3 p-5 sm:grid-cols-2">
              <Field label="Position">
                <Select value={positionId || e.positionId} onChange={(ev) => setPositionId(ev.target.value)}>
                  {positions.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.title}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Effective">
                <DatePicker value={from} onChange={setFrom} />
              </Field>
              <Field label="New grade">
                <Input value={grade || e.grade} onChange={(ev) => setGrade(ev.target.value)} />
              </Field>
              <Field label="New basic">
                <Input value={basic || String(e.basic)} onChange={(ev) => setBasic(ev.target.value)} />
              </Field>
              <div className="flex flex-wrap gap-2 sm:col-span-2">
                <Button
                  variant="secondary"
                  onClick={() => {
                    const pos = positions.find((p) => p.id === (positionId || e.positionId));
                    const r = transferEmployee(e.id, pos?.id ?? e.positionId, pos?.unitId ?? e.unitId, from);
                    if (!r.ok) toast.error(r.reason);
                    else toast.success("Transfer dated");
                  }}
                >
                  Transfer
                </Button>
                <Button
                  onClick={() => {
                    const pos = positions.find((p) => p.id === (positionId || e.positionId));
                    const r = promoteEmployee(e.id, grade || e.grade, pos?.id ?? e.positionId, Number(basic || e.basic), from);
                    if (!r.ok) toast.error(r.reason);
                    else toast.success("Promotion dated");
                  }}
                >
                  Promote
                </Button>
                <Button
                  variant="danger"
                  onClick={() => {
                    startSeparation(e.id, "resignation", "2026-12-31");
                    toast.success("Notice started");
                  }}
                >
                  Separate
                </Button>
              </div>
            </Card>
          )}
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="p-5">
              <h2 className="mb-3 font-semibold">Family & nominations</h2>
              {e.family.length === 0 && <p className="text-sm text-muted">No dependents on file.</p>}
              {e.family.map((f) => (
                <p key={f.id} className="text-sm">
                  {f.name} · {f.relation}
                </p>
              ))}
              <p className="mt-3 text-xs text-muted">
                PF nominee: {e.nominations[0]?.nominee} ({e.nominations[0]?.share}%)
              </p>
            </Card>
            <Card className="p-5">
              <h2 className="mb-3 font-semibold">Leave & housing</h2>
              <ul className="space-y-1 text-sm">
                {balances.map((b) => (
                  <li key={b.typeId} className="flex justify-between">
                    <span>{types.find((t) => t.id === b.typeId)?.code}</span>
                    <span>{b.balance}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-sm text-muted">{q ? `Quarter ${q.number}` : "HRA eligible, no quarter"}</p>
              {certs.map((c) => (
                <p key={c.id} className="text-xs text-muted">
                  {courses.find((x) => x.id === c.courseId)?.name} till {c.expires}
                </p>
              ))}
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { inr } from "@/lib/format";
import { useCurrentUser, useHrms } from "@/lib/store";
import { toast } from "sonner";

export default function TownshipPage() {
  const quarters = useHrms((s) => s.quarters);
  const employees = useHrms((s) => s.employees);
  const maint = useHrms((s) => s.maintenance);
  const waiting = useHrms((s) => s.waiting);
  const role = useHrms((s) => s.actingRole);
  const me = useCurrentUser();
  const allotQuarter = useHrms((s) => s.allotQuarter);
  const addWaiting = useHrms((s) => s.addWaiting);
  const raiseMaintenance = useHrms((s) => s.raiseMaintenance);
  const tickMaintenance = useHrms((s) => s.tickMaintenance);

  return (
    <div>
      <PageHeader
        title="Township housing"
        actions={
          me && (
            <Button
              variant="secondary"
              onClick={() => {
                addWaiting(me.id, "III");
                toast.success("Added to Type III waiting list");
              }}
            >
              Join waiting list
            </Button>
          )
        }
      />
      {waiting.length > 0 && (
        <Card className="mb-5 p-4">
          <p className="mb-2 font-semibold">Waiting list</p>
          {waiting.map((w) => (
            <p key={w.id} className="text-sm">
              {employees.find((e) => e.id === w.employeeId)?.name} · Type {w.type} · {w.applied}
            </p>
          ))}
        </Card>
      )}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {quarters.map((q) => (
          <Card key={q.id} className="p-4">
            <div className="flex justify-between">
              <p className="font-semibold">Type {q.type} · {q.number}</p>
              <Badge tone={q.status === "occupied" ? "ok" : q.status === "vacant" ? "lilac" : "warn"}>{q.status}</Badge>
            </div>
            <p className="mt-2 text-sm text-muted">
              {q.employeeId ? employees.find((e) => e.id === q.employeeId)?.name : "Waiting list"}
            </p>
            <p className="text-sm">Licence fee {inr(q.licenceFee)}</p>
            {role === "hr_admin" && q.status === "vacant" && waiting[0] && (
              <button
                className="mt-2 text-xs font-semibold text-brand"
                onClick={() => {
                  const r = allotQuarter(q.id, waiting[0].employeeId);
                  if (!r.ok) toast.error(r.reason);
                  else toast.success("Allotted. HRA will stop.");
                }}
              >
                Allot to {employees.find((e) => e.id === waiting[0].employeeId)?.preferredName}
              </button>
            )}
            {q.employeeId === me?.id && (
              <button
                className="mt-2 text-xs font-semibold text-brand"
                onClick={() => {
                  raiseMaintenance(q.id, "Reported from ESS");
                  toast.success("Maintenance ticket raised");
                }}
              >
                Raise maintenance
              </button>
            )}
          </Card>
        ))}
      </div>
      <h2 className="mb-3 mt-8 font-semibold">Maintenance</h2>
      <div className="grid gap-2">
        {maint.map((m) => (
          <Card key={m.id} className="flex items-center justify-between p-4">
            <p className="text-sm">{m.title}</p>
            <button onClick={() => tickMaintenance(m.id)}>
              <Badge>{m.status.replaceAll("_", " ")}</Badge>
            </button>
          </Card>
        ))}
      </div>
    </div>
  );
}

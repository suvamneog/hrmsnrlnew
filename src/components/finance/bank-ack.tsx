"use client";

import { Field, Panel, Pill, Rows } from "@/components/desk/kit";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useDesk } from "@/lib/desk";
import { formatStamp, inr } from "@/lib/format";
import { useCurrentUser, useHrms } from "@/lib/store";
import type { PayrollRun } from "@/lib/types";
import { useState } from "react";
import { toast } from "sonner";

/* The SBI return file says how many salaries were credited and which accounts bounced.
   Finance records it here so payroll can re-pay the rejected ones next working day. */
export function BankAck({ run }: { run: PayrollRun }) {
  const me = useCurrentUser();
  const role = useHrms((s) => s.actingRole);
  const employees = useHrms((s) => s.employees);
  const acks = useDesk((s) => s.bankAcks);
  const record = useDesk((s) => s.recordBankAck);
  const [account, setAccount] = useState("");
  const [reason, setReason] = useState("Account closed");
  const [rejected, setRejected] = useState<{ account: string; reason: string }[]>([]);
  const ack = acks.find((a) => a.runId === run.id);
  const sent = run.results.length;
  const released = run.stage === "bank_file" || run.stage === "publish";
  const who = (acc: string) => employees.find((e) => e.bankAccount === acc);

  return (
    <Panel
      title="SBI acknowledgement"
      note={released ? `${sent.toLocaleString("en-IN")} salaries sent in the bank file.` : "The bank file goes out after Finance approves the run."}
    >
      {ack ? (
        <div className="space-y-3">
          <p className="text-sm text-ink">{`${ack.credited.toLocaleString("en-IN")} credited, ${ack.rejected.length} rejected. Recorded ${formatStamp(ack.at)}.`}</p>
          <Rows
            items={ack.rejected.map((r) => ({ id: r.account, ...r }))}
            empty="No accounts rejected."
            render={(r) => {
              const e = who(r.account);
              const net = e ? run.results.find((x) => x.employeeId === e.id)?.net : undefined;
              return (
                <>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-ink">{e?.name ?? `Account ${r.account}`}</p>
                    <p className="text-[12px] text-muted">{`${r.reason}${net ? `, ${inr(net)} to re-pay` : ""}`}</p>
                  </div>
                  <Pill tone="danger">Re-pay</Pill>
                </>
              );
            }}
          />
        </div>
      ) : role === "finance_approver" && released ? (
        <form
          className="grid gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            record({ runId: run.id, by: me!.id, credited: sent - rejected.length, rejected });
            toast.success("Acknowledgement recorded");
          }}
        >
          <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] sm:items-end">
            <Field label="Rejected account">
              <Input value={account} onChange={(e) => setAccount(e.target.value.replace(/\D/g, ""))} placeholder="Account number" />
            </Field>
            <Field label="Reason">
              <Input value={reason} onChange={(e) => setReason(e.target.value)} />
            </Field>
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                if (account.length < 6) return toast.error("Enter the rejected account number.");
                setRejected([...rejected, { account, reason }]);
                setAccount("");
              }}
            >
              Add
            </Button>
          </div>
          {rejected.length > 0 && <p className="text-[13px] text-muted">{`Rejected so far: ${rejected.map((r) => r.account).join(", ")}`}</p>}
          <div>
            <Button type="submit">{`Record ${(sent - rejected.length).toLocaleString("en-IN")} credited`}</Button>
          </div>
        </form>
      ) : (
        <p className="text-sm text-muted">{released ? "Waiting for Finance to record the bank's return file." : "Nothing to record yet."}</p>
      )}
    </Panel>
  );
}

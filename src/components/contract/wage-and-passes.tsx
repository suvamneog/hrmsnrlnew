"use client";

import { Grid2, Panel, Pill, Rows } from "@/components/desk/kit";
import { Button } from "@/components/ui/button";
import { DEMO_TODAY } from "@/lib/demo";
import { MIN_WAGE, useDesk } from "@/lib/desk";
import { formatDay, formatStamp } from "@/lib/format";
import { passBlockReason } from "@/lib/gate";
import { useHrms } from "@/lib/store";
import { addDays, differenceInCalendarDays, format, parseISO } from "date-fns";
import { toast } from "sonner";

/* Two Contract Labour Cell checks: wage sheets against the minimum wage, and gate passes
   that run out in the next fortnight, renewed only when every check behind the pass still holds. */
export function WageAndPasses() {
  const role = useHrms((s) => s.actingRole);
  const contractors = useHrms((s) => s.contractors);
  const workers = useHrms((s) => s.workers);
  const passes = useHrms((s) => s.passes);
  const certs = useHrms((s) => s.certificates);
  const renewPass = useHrms((s) => s.renewPass);
  const wages = useDesk((s) => s.wages);
  const notice = useDesk((s) => s.sendWageNotice);
  const cell = role === "contract_labour_cell";
  const cname = (id: string) => contractors.find((c) => c.id === id)?.name ?? id;

  const soon = format(addDays(parseISO(DEMO_TODAY), 14), "yyyy-MM-dd");
  const renewals = passes
    .filter((p) => p.validTo >= DEMO_TODAY && p.validTo <= soon)
    .map((p) => {
      const w = workers.find((x) => x.id === p.workerId);
      const c = contractors.find((x) => x.id === w?.contractorId);
      const reason = w && c ? passBlockReason({ worker: w, contractor: c, certs, today: DEMO_TODAY }) : "Worker not on register";
      return { id: p.id, pass: p, worker: w, reason };
    })
    .sort((a, b) => a.pass.validTo.localeCompare(b.pass.validTo))
    .slice(0, 12);

  return (
    <Grid2>
      <Panel title="Minimum wage check" note="Daily wage on each contractor's sheet against the central minimum for area B (demo rates, to confirm).">
        <Rows
          items={wages}
          empty="No wage sheets filed."
          render={(w) => {
            const min = MIN_WAGE[w.skill];
            const short = w.paidDaily < min;
            return (
              <>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-ink">{`${cname(w.contractorId)}, ${w.skill.toLowerCase()}`}</p>
                  <p className="text-[12px] text-muted">
                    {short
                      ? `Pays ₹${w.paidDaily} a day against ₹${min}. ${w.workers} workers short ₹${((min - w.paidDaily) * w.workers * 26).toLocaleString("en-IN")} a month.`
                      : `Pays ₹${w.paidDaily} a day, at or above ₹${min}.`}
                  </p>
                </div>
                {short ? (
                  w.noticeAt ? (
                    <Pill tone="warn">{`Notice sent ${formatStamp(w.noticeAt).split(",")[0]}`}</Pill>
                  ) : cell ? (
                    <Button variant="secondary" className="h-8 px-3 text-[13px]" onClick={() => (notice(w.id), toast.success("Notice sent; the difference is held from the next bill"))}>
                      Send notice
                    </Button>
                  ) : (
                    <Pill tone="danger">Below minimum</Pill>
                  )
                ) : (
                  <Pill tone="ok">Compliant</Pill>
                )}
              </>
            );
          }}
        />
      </Panel>

      <Panel title="Passes to renew" note="Gate passes ending in the next 14 days. Renewal needs police, medical, induction and certificates to still hold.">
        <Rows
          items={renewals}
          empty="No passes end in the next 14 days."
          render={(r) => {
            const days = differenceInCalendarDays(parseISO(r.pass.validTo), parseISO(DEMO_TODAY));
            return (
              <>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-ink">{`${r.worker?.name ?? r.pass.workerId}, ${r.pass.id}`}</p>
                  <p className="text-[12px] text-muted">{r.reason ? `Cannot renew: ${r.reason}.` : `Ends ${formatDay(r.pass.validTo)}, in ${days} days.`}</p>
                </div>
                {cell && !r.reason ? (
                  <Button
                    variant="secondary"
                    className="h-8 px-3 text-[13px]"
                    onClick={() => {
                      const until = format(addDays(parseISO(r.pass.validTo), 90), "yyyy-MM-dd");
                      renewPass(r.pass.id, until);
                      toast.success(`Pass renewed to ${formatDay(until)}`);
                    }}
                  >
                    Renew 90 days
                  </Button>
                ) : (
                  <Pill tone={r.reason ? "danger" : "warn"}>{r.reason ? "Blocked" : `${days} days`}</Pill>
                )}
              </>
            );
          }}
        />
      </Panel>
    </Grid2>
  );
}

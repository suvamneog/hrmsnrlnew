import { inrExact } from "@/lib/format";
import type { Employee, PayResult } from "@/lib/types";

/* A payslip drawn as a document, for folder previews. */
export function PayslipPreview({ employee, row, label }: { employee: Employee; row: PayResult; label: string }) {
  const earn = row.lines.filter((l) => l.type === "earning");
  const ded = row.lines.filter((l) => l.type === "deduction");
  return (
    <div className="min-h-full bg-white p-7 text-[13px] text-ink">
      <div className="flex items-start justify-between border-b border-line pb-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-brand">Numaligarh Refinery Limited</p>
          <p className="mt-1 text-xl font-semibold tracking-tight">Payslip · {label}</p>
        </div>
        <div className="text-right text-[12px] text-muted">
          <p className="font-semibold text-ink">{employee.name}</p>
          <p>
            {employee.empNo} · {employee.grade}
          </p>
        </div>
      </div>
      <div className="mt-4 grid gap-6 sm:grid-cols-2">
        <Section title="Earnings" lines={earn} total={row.gross} />
        <Section title="Deductions" lines={ded} total={row.deductions} />
      </div>
      <div className="mt-5 flex items-baseline justify-between rounded-2xl bg-brand-soft px-4 py-3">
        <span className="font-semibold text-brand">Net pay</span>
        <span className="text-xl font-semibold tabular-nums">{inrExact(row.net)}</span>
      </div>
    </div>
  );
}

function Section({ title, lines, total }: { title: string; lines: { code: string; label: string; amount: number }[]; total: number }) {
  return (
    <div>
      <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted">{title}</p>
      {lines.map((l) => (
        <div key={l.code} className="flex justify-between py-1">
          <span className="text-muted">{l.label}</span>
          <span className="tabular-nums">{inrExact(l.amount)}</span>
        </div>
      ))}
      <div className="mt-1 flex justify-between border-t border-line pt-1.5 font-semibold">
        <span>Total</span>
        <span className="tabular-nums">{inrExact(total)}</span>
      </div>
    </div>
  );
}

/* A generated file shown as its first lines, like a text viewer. */
export function FilePreview({ name, content, kind }: { name: string; content: string; kind: string }) {
  const lines = content.split("\n").slice(0, 40);
  return (
    <div className="min-h-full bg-white p-6">
      <div className="mb-3 flex items-center justify-between">
        <p className="truncate text-sm font-semibold">{name}</p>
        <span className="rounded-md bg-brand-soft px-2 py-0.5 text-[11px] font-semibold uppercase text-brand">{kind}</span>
      </div>
      <pre className="overflow-hidden rounded-xl bg-[#f6f8fd] p-4 font-mono text-[11px] leading-relaxed text-ink">{lines.join("\n")}</pre>
    </div>
  );
}

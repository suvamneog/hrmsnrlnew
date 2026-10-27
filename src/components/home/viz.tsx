"use client";

import { AnimatedNumber } from "@/components/motion/animated-number";
import { cn } from "@/lib/cn";
import { easeOut as ease } from "@/lib/motion";
import { motion, useReducedMotion } from "motion/react";
import type { ReactNode } from "react";


/* Thin progress ring with the figure set inside, in the style of Apple's activity rings. */
export function Ring({
  value,
  max,
  size = 132,
  stroke = 10,
  color = "var(--brand)",
  track = "#eef1f8",
  children,
}: {
  value: number;
  max: number;
  size?: number;
  stroke?: number;
  color?: string;
  track?: string;
  children?: ReactNode;
}) {
  const reduce = useReducedMotion();
  const r = (size - stroke) / 2;
  const share = max > 0 ? Math.min(1, value / max) : 0;
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} stroke={track} strokeWidth={stroke} fill="none" />
        {share > 0 && (
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          fill="none"
          initial={{ pathLength: reduce ? share : 0 }}
          whileInView={{ pathLength: share }}
          viewport={{ once: true }}
          transition={{ duration: 1.1, ease }}
        />
        )}
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">{children}</div>
    </div>
  );
}

/* Big tabular figure with a small caption, counting up on first view. */
export function Figure({
  value,
  label,
  format,
  className,
  size = "lg",
}: {
  value: number;
  label: string;
  format?: (n: number) => string;
  className?: string;
  size?: "lg" | "md";
}) {
  return (
    <div className={className}>
      <p
        className={cn(
          "font-semibold tabular-nums tracking-[-0.03em] text-ink",
          size === "lg" ? "text-[40px] leading-none" : "text-[26px] leading-none",
        )}
      >
        <AnimatedNumber value={value} format={format} />
      </p>
      <p className="mt-2 text-[12px] font-medium text-muted">{label}</p>
    </div>
  );
}

/* Horizontal bars, one row per item, each growing to its share of the largest. */
export function Bars({
  rows,
  color = "var(--brand)",
  format = (n: number) => n.toLocaleString("en-IN"),
  max: fixedMax,
}: {
  rows: { label: string; value: number; hint?: string; tone?: string }[];
  color?: string;
  format?: (n: number) => string;
  max?: number;
}) {
  const max = fixedMax ?? Math.max(1, ...rows.map((r) => r.value));
  return (
    <ul className="space-y-3">
      {rows.map((r, i) => (
        <li key={r.label}>
          <div className="mb-1.5 flex items-baseline justify-between gap-3 text-[13px]">
            <span className="truncate font-medium text-ink">{r.label}</span>
            <span className="shrink-0 tabular-nums text-muted">
              {format(r.value)}
              {r.hint ? <span className="ml-1 text-[11px]">{r.hint}</span> : null}
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-[#eef1f8]">
            <motion.div
              className="h-full rounded-full"
              style={{ background: r.tone ?? color }}
              initial={{ width: 0 }}
              whileInView={{ width: `${(r.value / max) * 100}%` }}
              viewport={{ once: true }}
              transition={{ duration: 0.9, ease, delay: 0.06 * i }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}

/* Vertical columns for a short series, the last one picked out. */
export function Columns({
  data,
  height = 120,
  format = (n: number) => n.toLocaleString("en-IN"),
}: {
  data: { label: string; value: number }[];
  height?: number;
  format?: (n: number) => string;
}) {
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <div className="flex items-end gap-3" style={{ height: height + 40 }}>
      {data.map((d, i) => {
        const last = i === data.length - 1;
        return (
          <div key={d.label} className="flex flex-1 flex-col items-center justify-end gap-2">
            <span className={cn("text-[11px] tabular-nums", last ? "font-semibold text-ink" : "text-muted")}>
              {format(d.value)}
            </span>
            <motion.div
              className="w-full max-w-[44px] rounded-[10px]"
              style={{ background: last ? "var(--brand)" : "#dfe5f7" }}
              initial={{ height: 4 }}
              whileInView={{ height: Math.max(4, (d.value / max) * height) }}
              viewport={{ once: true }}
              transition={{ duration: 0.9, ease, delay: 0.08 * i }}
            />
            <span className="text-[11px] font-medium text-muted">{d.label}</span>
          </div>
        );
      })}
    </div>
  );
}

/* Hiring funnel: each stage narrower than the last, counts on the right. */
export function Funnel({ steps }: { steps: { label: string; value: number }[] }) {
  const max = Math.max(1, ...steps.map((s) => s.value));
  return (
    <ul className="space-y-2">
      {steps.map((s, i) => (
        <li key={s.label} className="flex items-center gap-3">
          <span className="w-[76px] shrink-0 text-[12px] font-medium text-muted">{s.label}</span>
          <div className="relative h-8 flex-1">
            <motion.div
              className="absolute inset-y-0 left-0 rounded-[10px]"
              style={{ background: `color-mix(in srgb, var(--brand) ${100 - i * 13}%, white)` }}
              initial={{ width: 0 }}
              whileInView={{ width: `${Math.max(8, (s.value / max) * 100)}%` }}
              viewport={{ once: true }}
              transition={{ duration: 0.9, ease, delay: 0.07 * i }}
            />
            <span className="absolute inset-y-0 left-3 flex items-center text-[13px] font-semibold text-white tabular-nums">
              {s.value}
            </span>
          </div>
        </li>
      ))}
    </ul>
  );
}

/* Segmented stage tracker: done, current, and to come. */
export function StageTrack({ stages, current }: { stages: { id: string; label: string }[]; current: string }) {
  const at = stages.findIndex((s) => s.id === current);
  return (
    <div>
      <div className="flex gap-1.5">
        {stages.map((s, i) => (
          <div key={s.id} className="h-1.5 flex-1 overflow-hidden rounded-full bg-[#eef1f8]">
            <motion.div
              className="h-full rounded-full"
              style={{ background: i < at ? "var(--brand)" : i === at ? "#8fa0ff" : "transparent" }}
              initial={{ width: 0 }}
              whileInView={{ width: "100%" }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, ease, delay: 0.05 * i }}
            />
          </div>
        ))}
      </div>
      <div className="mt-2 flex justify-between text-[11px] text-muted">
        <span>{stages[0]?.label}</span>
        <span className="font-semibold text-ink">{stages[at]?.label ?? "—"}</span>
        <span>{stages[stages.length - 1]?.label}</span>
      </div>
    </div>
  );
}

/* Small label-value line for the facts beside a visual. */
export function Fact({ label, value, tone }: { label: string; value: ReactNode; tone?: "warn" | "ok" | "danger" }) {
  const color = tone === "warn" ? "text-[#c47b00]" : tone === "danger" ? "text-[#d13b3b]" : tone === "ok" ? "text-[#0f9f6e]" : "text-ink";
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-line py-2.5 text-[13px] last:border-0">
      <span className="shrink-0 text-muted">{label}</span>
      <span className={cn("min-w-0 text-right font-semibold tabular-nums", color)}>{value}</span>
    </div>
  );
}

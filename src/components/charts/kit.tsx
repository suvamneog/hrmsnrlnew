"use client";

import {
  ChartContainer,
  ChartTooltip,
  type ChartConfig,
} from "@/components/shadcn/chart";
import { ChartDetail, ChartTitle, type DetailRow } from "@/components/charts/detail";
import { InView } from "@/components/motion/in-view";
import { cn } from "@/lib/cn";
import { easeOut } from "@/lib/motion";
import { AnimatePresence, motion, useInView, useReducedMotion } from "motion/react";
import { createPortal } from "react-dom";
import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ReferenceLine,
  XAxis,
  YAxis,
} from "recharts";

/* One colour rule for every chart: blue is the series that matters, greys are comparison,
   amber asks for attention and red means blocked. Other keys are aliases kept for callers. */
export const C = {
  blue: "#3d5afe",
  green: "#3d5afe",
  sky: "#a1a1a6",
  violet: "#6e6e73",
  teal: "#c7c7cc",
  slate: "#d2d2d7",
  amber: "#d4a24c",
  red: "#e5484d",
  accent: "#3d5afe",
} as const;

export type Series = { key: string; label: string; color: string };

const config = (series: Series[]): ChartConfig =>
  Object.fromEntries(
    series.map((s) => [s.key, { label: s.label, color: s.color }]),
  );

// Recharts reads these classes; the cursor and grid stay quiet so the data leads.
const surface =
  "aspect-auto w-full cursor-pointer [&_*:focus]:outline-none [&_.recharts-wrapper]:outline-none [&_.recharts-surface]:outline-none [&_.recharts-rectangle.recharts-tooltip-cursor]:fill-[#f2f2f0] [&_.recharts-curve.recharts-tooltip-cursor]:stroke-[#d2d2d7] [&_.recharts-cartesian-axis-tick_text]:fill-[#8e8e93]";

const DURATION = 900;

/* Card that frames every chart: title, a headline figure, the so-what line, legend, then the plot. */
export function ChartCard({
  title,
  value,
  note,
  series,
  sample,
  action,
  className,
  children,
}: {
  title: string;
  value?: ReactNode;
  note?: string;
  series?: Series[];
  sample?: boolean;
  action?: ReactNode;
  className?: string;
  children: ReactNode;
}) {
  return (
    <ChartTitle.Provider value={title}>
    <InView className={cn("min-w-0", className)}>
      <div className="h-full rounded-xl border border-line bg-white p-5 sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="flex items-center gap-2 text-[15px] font-semibold tracking-tight text-ink">
              {title}
              {sample && (
                <span className="rounded-md bg-[#fff4dc] px-1.5 py-0.5 text-[11px] font-medium text-[#8a5600]">
                  Sample
                </span>
              )}
            </h3>
            {value !== undefined && (
              <p className="mt-2 text-[28px] font-semibold leading-none tracking-[-0.03em] tabular-nums">
                {value}
              </p>
            )}
            {note && <p className="mt-1.5 text-[12px] text-muted">{note}</p>}
          </div>
          {action}
        </div>
        {series && series.length > 1 && (
          <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1.5">
            {series.map((s) => (
              <span
                key={s.key}
                className="inline-flex items-center gap-1.5 text-[12px] text-muted"
              >
                <span
                  className="h-2 w-2 rounded-[3px]"
                  style={{ background: s.color }}
                />
                {s.label}
              </span>
            ))}
          </div>
        )}
        <div className="mt-4">{children}</div>
      </div>
    </InView>
    </ChartTitle.Provider>
  );
}

/* Plays the chart's draw-in only once it scrolls into view. */
function useSeen() {
  const ref = useRef<HTMLDivElement>(null);
  const seen = useInView(ref, { once: true, margin: "0px 0px -10% 0px" });
  return { ref, seen };
}

/* Tooltip: white card, a dot per series, numbers right-aligned. */
function Tip({
  active,
  payload,
  label,
  series,
  format,
  labelFormat,
}: {
  active?: boolean;
  payload?: {
    dataKey?: string | number;
    value?: number | string;
    color?: string;
    payload?: Record<string, unknown>;
  }[];
  label?: string | number;
  series: Series[];
  format: (n: number) => string;
  labelFormat?: (l: string, row?: Record<string, unknown>) => string;
}) {
  if (!active || !payload?.length) return null;
  const row = payload[0]?.payload;
  const total = payload.reduce((n, p) => n + (Number(p.value) || 0), 0);
  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18, ease: easeOut }}
      className="min-w-[168px] rounded-xl bg-white px-3 py-2.5 text-[12px] ring-1 ring-[#ebebea]"
    >
      <p className="mb-1.5 font-semibold text-ink">
        {labelFormat ? labelFormat(String(label ?? ""), row) : label}
      </p>
      {payload.map((p) => {
        const s = series.find((x) => x.key === p.dataKey);
        return (
          <div
            key={String(p.dataKey)}
            className="flex items-center justify-between gap-4 py-0.5"
          >
            <span className="inline-flex items-center gap-1.5 text-muted">
              <span
                className="h-2 w-2 rounded-[3px]"
                style={{ background: s?.color ?? p.color }}
              />
              {s?.label ?? p.dataKey}
            </span>
            <span className="font-semibold tabular-nums text-ink">
              {format(Number(p.value) || 0)}
            </span>
          </div>
        );
      })}
      {payload.length > 1 && (
        <div className="mt-1 flex justify-between border-t border-line pt-1.5">
          <span className="text-muted">Total</span>
          <span className="font-semibold tabular-nums">{format(total)}</span>
        </div>
      )}
    </motion.div>
  );
}

type Row = Record<string, string | number>;

/* Turns chart rows into the detail sheet's parts, and reads the clicked index from Recharts. */
const detailRows = (data: Row[], x: string, series: Series[]): DetailRow[] =>
  data.map((r) => ({
    label: String(r[x]),
    parts: series.map((s) => ({ ...s, value: Number(r[s.key]) || 0 })),
  }));
const clicked = (state: unknown) => {
  const i = (state as { activeTooltipIndex?: number | string | null } | null)?.activeTooltipIndex;
  return i === null || i === undefined || i === "" ? null : Number(i);
};
const n0 = (n: number) => n.toLocaleString("en-IN");

/* Axis units, written as plain captions: the value axis above the plot, the category axis below. */
function AxisNote({
  children,
  align = "left",
}: {
  children?: ReactNode;
  align?: "left" | "right";
}) {
  if (!children) return null;
  return (
    <p
      className={cn(
        "text-[11px] text-muted",
        align === "right" ? "mt-1 text-right" : "mb-1",
      )}
    >
      {children}
    </p>
  );
}

/* Vertical bars, stacked or grouped, with an optional threshold line. */
export function Bars({
  data,
  x,
  series,
  stacked = true,
  height = 220,
  format = n0,
  labelFormat,
  threshold,
  highlight,
  unit,
  xUnit,
}: {
  data: Row[];
  x: string;
  series: Series[];
  stacked?: boolean;
  height?: number;
  format?: (n: number) => string;
  labelFormat?: (l: string, row?: Record<string, unknown>) => string;
  threshold?: { value: number; label: string };
  // Recolour a bar when it breaks a rule, e.g. below minimum manning.
  highlight?: { key: string; when: (row: Row) => boolean; color: string };
  // What the numbers are, e.g. "People per day", and what the categories are, e.g. "Day".
  unit?: string;
  xUnit?: string;
}) {
  const { ref, seen } = useSeen();
  const [pick, setPick] = useState<number | null>(null);
  return (
    <div>
      <ChartDetail rows={detailRows(data, x, series)} index={pick} onIndex={setPick} format={format} unit={unit} stacked={stacked} threshold={threshold} />
      <AxisNote>{unit}</AxisNote>
      <div ref={ref} style={{ height }}>
        {seen && (
          <ChartContainer
            config={config(series)}
            className={surface}
            style={{ height }}
          >
            <BarChart
              onClick={(st) => setPick(clicked(st))}
              data={data}
              margin={{ top: 8, right: 4, left: -8, bottom: 0 }}
              barCategoryGap={stacked ? "22%" : "18%"}
            >
              <CartesianGrid
                vertical={false}
                strokeDasharray="3 4"
                stroke="#efefed"
              />
              <XAxis
                dataKey={x}
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                fontSize={11}
                minTickGap={8}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                fontSize={11}
                width={56}
                allowDecimals={false}
                tickFormatter={(v: number) => format(v)}
              />
              <ChartTooltip
                cursor={{ radius: 8 }}
                content={
                  <Tip
                    series={series}
                    format={format}
                    labelFormat={labelFormat}
                  />
                }
              />
              {threshold && (
                <ReferenceLine
                  y={threshold.value}
                  stroke={C.red}
                  strokeDasharray="4 4"
                  strokeOpacity={0.7}
                  label={{
                    value: threshold.label,
                    position: "insideTopRight",
                    fill: C.red,
                    fontSize: 11,
                  }}
                />
              )}
              {series.map((s, i) => (
                <Bar
                  key={s.key}
                  dataKey={s.key}
                  stackId={stacked ? "a" : undefined}
                  fill={s.color}
                  radius={
                    stacked
                      ? i === series.length - 1
                        ? [6, 6, 0, 0]
                        : [0, 0, 0, 0]
                      : [6, 6, 0, 0]
                  }
                  animationDuration={DURATION}
                  animationBegin={i * 90}
                  animationEasing="ease-out"
                >
                  {highlight?.key === s.key &&
                    data.map((row, j) => (
                      <Cell
                        key={j}
                        fill={highlight.when(row) ? highlight.color : s.color}
                      />
                    ))}
                </Bar>
              ))}
            </BarChart>
          </ChartContainer>
        )}
      </div>
      <AxisNote align="right">{xUnit}</AxisNote>
    </div>
  );
}

/* Horizontal bars for ranked categories; long labels stay readable. */
export function HBars({
  data,
  y,
  series,
  stacked = true,
  height,
  format = n0,
  labelWidth = 110,
  unit,
}: {
  data: Row[];
  y: string;
  series: Series[];
  stacked?: boolean;
  height?: number;
  format?: (n: number) => string;
  labelWidth?: number;
  // What the numbers are, e.g. "People per day", and what the categories are, e.g. "Day".
  unit?: string;
  xUnit?: string;
}) {
  const { ref, seen } = useSeen();
  const h = height ?? Math.max(120, data.length * 40 + 24);
  const [pick, setPick] = useState<number | null>(null);
  return (
    <div>
      <ChartDetail rows={detailRows(data, y, series)} index={pick} onIndex={setPick} format={format} unit={unit} stacked={stacked} />
      <div ref={ref} style={{ height: h }}>
        {seen && (
          <ChartContainer
            config={config(series)}
            className={surface}
            style={{ height: h }}
          >
            <BarChart
              onClick={(st) => setPick(clicked(st))}
              data={data}
              layout="vertical"
              margin={{ top: 0, right: 12, left: 0, bottom: 0 }}
              barCategoryGap="28%"
            >
              <CartesianGrid
                horizontal={false}
                strokeDasharray="3 4"
                stroke="#efefed"
              />
              <XAxis
                type="number"
                tickLine={false}
                axisLine={false}
                fontSize={11}
                allowDecimals={false}
                tickFormatter={(v: number) => format(v)}
              />
              <YAxis
                type="category"
                dataKey={y}
                tickLine={false}
                axisLine={false}
                fontSize={12}
                width={labelWidth}
                tick={{ fill: "#1b2140" }}
              />
              <ChartTooltip
                cursor={{ radius: 8 }}
                content={<Tip series={series} format={format} />}
              />
              {series.map((s, i) => (
                <Bar
                  key={s.key}
                  dataKey={s.key}
                  stackId={stacked ? "a" : undefined}
                  fill={s.color}
                  radius={
                    stacked
                      ? i === series.length - 1
                        ? [0, 6, 6, 0]
                        : [0, 0, 0, 0]
                      : [0, 6, 6, 0]
                  }
                  animationDuration={DURATION}
                  animationBegin={i * 90}
                  animationEasing="ease-out"
                />
              ))}
            </BarChart>
          </ChartContainer>
        )}
      </div>
      <AxisNote align="right">{unit}</AxisNote>
    </div>
  );
}

/* Smooth area lines for flows over time. */
export function Areas({
  data,
  x,
  series,
  height = 220,
  format = n0,
  stacked = false,
  unit,
  xUnit,
}: {
  data: Row[];
  x: string;
  series: Series[];
  height?: number;
  format?: (n: number) => string;
  stacked?: boolean;
  // What the numbers are, e.g. "People per day", and what the categories are, e.g. "Day".
  unit?: string;
  xUnit?: string;
}) {
  const { ref, seen } = useSeen();
  const [pick, setPick] = useState<number | null>(null);
  return (
    <div>
      <ChartDetail rows={detailRows(data, x, series)} index={pick} onIndex={setPick} format={format} unit={unit} stacked={stacked} />
      <AxisNote>{unit}</AxisNote>
      <div ref={ref} style={{ height }}>
        {seen && (
          <ChartContainer
            config={config(series)}
            className={surface}
            style={{ height }}
          >
            <AreaChart
              onClick={(st) => setPick(clicked(st))}
              data={data}
              margin={{ top: 8, right: 4, left: -18, bottom: 0 }}
            >
              <defs>
                {series.map((s) => (
                  <linearGradient
                    key={s.key}
                    id={`fill-${s.key}`}
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="0%" stopColor={s.color} stopOpacity={0.28} />
                    <stop
                      offset="100%"
                      stopColor={s.color}
                      stopOpacity={0.02}
                    />
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid
                vertical={false}
                strokeDasharray="3 4"
                stroke="#efefed"
              />
              <XAxis
                dataKey={x}
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                fontSize={11}
                minTickGap={14}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                fontSize={11}
                width={44}
                allowDecimals={false}
              />
              <ChartTooltip
                cursor={{ strokeDasharray: "3 3" }}
                content={<Tip series={series} format={format} />}
              />
              {series.map((s, i) => (
                <Area
                  key={s.key}
                  type="monotone"
                  dataKey={s.key}
                  stackId={stacked ? "a" : undefined}
                  stroke={s.color}
                  strokeWidth={2}
                  fill={`url(#fill-${s.key})`}
                  activeDot={{ r: 4, strokeWidth: 2, stroke: "#fff" }}
                  animationDuration={DURATION + 200}
                  animationBegin={i * 120}
                  animationEasing="ease-out"
                />
              ))}
            </AreaChart>
          </ChartContainer>
        )}
      </div>
      <AxisNote align="right">{xUnit}</AxisNote>
    </div>
  );
}

/* Donut with the headline figure in the middle; hover a slice to read it. */
export function Donut({
  data,
  center,
  centerLabel,
  height = 200,
  format = n0,
}: {
  data: { key: string; label: string; value: number; color: string }[];
  center: ReactNode;
  centerLabel: string;
  height?: number;
  format?: (n: number) => string;
}) {
  const { ref, seen } = useSeen();
  const series = data.map((d) => ({
    key: d.key,
    label: d.label,
    color: d.color,
  }));
  const [hover, setHover] = useState<number | null>(null);
  const total = data.reduce((n, d) => n + d.value, 0);
  const shown = hover === null ? null : data[hover];
  const [pick, setPick] = useState<number | null>(null);
  return (
    <div>
      <ChartDetail rows={data.map((d) => ({ label: d.label, parts: [{ ...d }] }))} index={pick} onIndex={setPick} format={format} />
      <div ref={ref} className="relative" style={{ height }}>
        {seen && (
          <ChartContainer
            config={config(series)}
            className={surface}
            style={{ height }}
          >
            <PieChart>
              <Pie
                data={data}
                dataKey="value"
                nameKey="label"
                innerRadius="68%"
                outerRadius="92%"
                paddingAngle={2}
                cornerRadius={6}
                stroke="none"
                onMouseEnter={(_, i) => setHover(i)}
                onMouseLeave={() => setHover(null)}
                onClick={(_, i) => setPick(i)}
                animationDuration={DURATION + 200}
                animationEasing="ease-out"
              >
                {data.map((d, i) => (
                  <Cell
                    key={d.key}
                    fill={d.color}
                    opacity={hover === null || hover === i ? 1 : 0.35}
                    style={{ transition: "opacity 200ms" }}
                  />
                ))}
              </Pie>
            </PieChart>
          </ChartContainer>
        )}
        <div className="pointer-events-none absolute inset-0 grid place-items-center text-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={shown?.key ?? "all"}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.18, ease: easeOut }}
            >
              <p className="text-[22px] font-semibold tabular-nums tracking-tight">
                {shown ? format(shown.value) : center}
              </p>
              <p className="text-[11px] text-muted">
                {shown
                  ? `${shown.label}, ${total ? Math.round((shown.value / total) * 100) : 0}%`
                  : centerLabel}
              </p>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
      {/* Every slice's count is written out, so nothing depends on hovering. */}
      <ul className="mt-4 grid gap-1.5 sm:grid-cols-2">
        {data.map((d) => (
          <li
            key={d.key}
            className="flex items-center justify-between gap-3 text-[13px]"
          >
            <span className="inline-flex items-center gap-2 text-muted">
              <span
                className="h-2.5 w-2.5 rounded-[3px]"
                style={{ background: d.color }}
              />
              {d.label}
            </span>
            <span className="tabular-nums text-ink">{`${format(d.value)}, ${total ? Math.round((d.value / total) * 100) : 0}%`}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* Grid of cells (rows × columns) with a floating card on hover. */
export function Heatmap({
  rows,
  cols,
  cell,
}: {
  rows: { key: string; label: string }[];
  cols: { key: string; label: string; sub?: string; today?: boolean }[];
  cell: (
    row: string,
    col: string,
  ) => {
    color: string;
    text?: string;
    // A picture in place of (or beside) the text, drawn in `ink`.
    icon?: ReactNode;
    ink?: string;
    title: string;
    detail?: string[];
    mark?: "swap" | "rest";
    // Shown in the card that opens when the cell is tapped.
    facts?: { label: string; value: string; tone?: "ok" | "warn" | "danger" }[];
  };
}) {
  const reduce = useReducedMotion();
  const [pin, setPin] = useState<{ row: string; col: string; rect: DOMRect } | null>(null);
  const [tip, setTip] = useState<{
    x: number;
    y: number;
    title: string;
    detail?: string[];
  } | null>(null);
  const box = useRef<HTMLDivElement>(null);
  const { ref, seen } = useSeen();
  return (
    <div ref={ref} className="relative overflow-x-auto">
      <div
        ref={box}
        className="relative min-w-max"
        onMouseLeave={() => setTip(null)}
      >
        <div
          className="grid gap-1"
          style={{ gridTemplateColumns: `112px repeat(${cols.length}, 34px)` }}
        >
          <span />
          {cols.map((c) => (
            <span
              key={c.key}
              className={cn(
                "pb-1 text-center text-[10px] leading-tight",
                c.today ? "font-semibold text-brand" : "text-muted",
              )}
            >
              {c.sub && <span className="block">{c.sub}</span>}
              {c.label}
            </span>
          ))}
          {rows.map((r, ri) => (
            <div key={r.key} className="contents">
              <span className="truncate pr-2 text-[12px] font-medium leading-[30px]">
                {r.label}
              </span>
              {cols.map((c, ci) => {
                const v = cell(r.key, c.key);
                return (
                  <motion.span
                    key={c.key}
                    initial={{ opacity: 0, scale: 0.6 }}
                    animate={seen ? { opacity: 1, scale: 1 } : {}}
                    transition={{
                      duration: 0.35,
                      ease: easeOut,
                      delay: (ri * cols.length + ci) * 0.004,
                    }}
                    role="button"
                    data-heatmap-cell
                    tabIndex={0}
                    aria-label={v.title}
                    onClick={(e) => {
                      setTip(null);
                      setPin({ row: r.key, col: c.key, rect: (e.currentTarget as HTMLElement).getBoundingClientRect() });
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        setPin({ row: r.key, col: c.key, rect: (e.currentTarget as HTMLElement).getBoundingClientRect() });
                      }
                    }}
                    onMouseEnter={(e) => {
                      if (pin) return;
                      const b = box.current?.getBoundingClientRect();
                      const t = (
                        e.currentTarget as HTMLElement
                      ).getBoundingClientRect();
                      if (b)
                        setTip({
                          x: t.left - b.left + t.width / 2,
                          y: t.top - b.top,
                          title: v.title,
                          detail: v.detail,
                        });
                    }}
                    className={cn(
                      "relative grid h-[30px] cursor-pointer place-items-center rounded-[8px] text-[10px] font-semibold outline-none transition-transform duration-150 hover:scale-110 hover:shadow-md focus-visible:ring-2 focus-visible:ring-brand",
                      pin?.row === r.key && pin?.col === c.key && "z-10 scale-110 shadow-md ring-2 ring-ink",
                    )}
                    style={{ background: v.color }}
                  >
                    <span
                      className={cn("grid place-items-center", !v.ink && (["#eef1f6", "#f2f2f0", "#d8dde8"].includes(v.color) ? "text-muted" : "text-white/95"))}
                      style={v.ink ? { color: v.ink } : undefined}
                    >
                      {v.icon ?? v.text}
                    </span>
                    {v.mark && (
                      <span
                        className={cn(
                          "absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full ring-2 ring-white",
                          v.mark === "rest" ? "bg-[#e5484d]" : "bg-[#e0a43d]",
                        )}
                      />
                    )}
                  </motion.span>
                );
              })}
            </div>
          ))}
        </div>
        <HeatmapCard pin={pin} cell={pin ? cell(pin.row, pin.col) : null} onClose={() => setPin(null)} reduce={!!reduce} />
        <AnimatePresence>
          {tip && !pin && (
            <motion.div
              key="tip"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0, left: tip.x, top: tip.y }}
              exit={{ opacity: 0 }}
              transition={{ type: "spring", stiffness: 500, damping: 38 }}
              className="pointer-events-none absolute z-20 -translate-x-1/2 -translate-y-[calc(100%+8px)] whitespace-nowrap rounded-xl bg-white px-3 py-2 text-[12px] shadow-[0_8px_24px_rgba(0,0,0,0.08)] ring-1 ring-[#ebebea]"
            >
              <p className="font-semibold">{tip.title}</p>
              {tip.detail?.map((d) => (
                <p key={d} className="text-muted">
                  {d}
                </p>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

/* The small card a tapped heatmap cell opens: anchored under (or above) the cell, kept on screen,
   closed by the ×, Escape, a tap elsewhere or scrolling. Rendered at the page root so the grid's
   own scroll box cannot clip it. */
function HeatmapCard({
  pin,
  cell,
  onClose,
  reduce,
}: {
  pin: { rect: DOMRect } | null;
  cell: { title: string; detail?: string[]; facts?: { label: string; value: string; tone?: "ok" | "warn" | "danger" }[]; color: string; ink?: string; icon?: ReactNode } | null;
  onClose: () => void;
  reduce: boolean;
}) {
  useEffect(() => {
    if (!pin) return;
    const key = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    const away = (e: PointerEvent) => !(e.target as Element).closest?.("[data-heatmap-card]") && !(e.target as Element).closest?.("[data-heatmap-cell]") && onClose();
    // Only a real page scroll closes it: tapping a cell can nudge the grid's own scroll box.
    const y0 = window.scrollY;
    const scrolled = () => Math.abs(window.scrollY - y0) > 8 && onClose();
    window.addEventListener("keydown", key);
    window.addEventListener("pointerdown", away);
    window.addEventListener("scroll", scrolled, { passive: true });
    return () => {
      window.removeEventListener("keydown", key);
      window.removeEventListener("pointerdown", away);
      window.removeEventListener("scroll", scrolled);
    };
  }, [pin, onClose]);
  if (typeof document === "undefined") return null;
  const W = Math.min(300, window.innerWidth - 24);
  const r = pin?.rect;
  const below = r ? r.bottom + 220 < window.innerHeight : true;
  const left = r ? Math.min(Math.max(12, r.left + r.width / 2 - W / 2), window.innerWidth - W - 12) : 0;
  const top = r ? (below ? r.bottom + 8 : r.top - 8) : 0;
  return createPortal(
    <AnimatePresence>
      {pin && cell && (
        <motion.div
          key={`${r?.left}-${r?.top}`}
          data-heatmap-card
          role="dialog"
          aria-label={cell.title}
          initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.94, y: below ? -4 : 4 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.97, transition: { duration: 0.12 } }}
          transition={{ type: "spring", bounce: 0, duration: 0.3 }}
          className="fixed z-[80] rounded-2xl bg-white p-4 text-[13px] shadow-[0_16px_40px_rgba(20,26,58,0.16)] ring-1 ring-black/5"
          style={{ left, top, width: W, translateY: below ? 0 : "-100%", transformOrigin: below ? "top center" : "bottom center" }}
        >
          <div className="flex items-start gap-3">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-[10px]" style={{ background: cell.color, color: cell.ink }}>
              {cell.icon}
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-semibold leading-snug text-ink">{cell.title}</p>
              {cell.detail?.[0] && <p className="text-[12px] text-muted">{cell.detail[0]}</p>}
            </div>
            <button type="button" aria-label="Close" onClick={onClose} className="-mr-1 -mt-1 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-fill text-muted hover:text-ink">
              <span className="text-[15px] leading-none">×</span>
            </button>
          </div>
          {cell.facts && cell.facts.length > 0 && (
            <ul className="mt-3 divide-y divide-fill border-t border-fill">
              {cell.facts.map((f) => (
                <li key={f.label} className="flex items-center justify-between gap-3 py-2">
                  <span className="text-muted">{f.label}</span>
                  <span className={cn("text-right font-medium tabular-nums", f.tone === "ok" ? "text-ok" : f.tone === "warn" ? "text-[#8a5600]" : f.tone === "danger" ? "text-danger" : "text-ink")}>{f.value}</span>
                </li>
              ))}
            </ul>
          )}
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}

/* Funnel stage bars with conversion from the previous stage on hover. */
export function FunnelChart({
  steps,
  color = C.blue,
}: {
  steps: { label: string; value: number }[];
  color?: string;
}) {
  const { ref, seen } = useSeen();
  const [hover, setHover] = useState<number | null>(null);
  const max = Math.max(1, ...steps.map((s) => s.value));
  return (
    <div ref={ref} className="space-y-2">
      {steps.map((s, i) => {
        const prev = i > 0 ? steps[i - 1].value : null;
        const conv = prev ? Math.round((s.value / prev) * 100) : 100;
        return (
          <div
            key={s.label}
            className="flex items-center gap-3"
            onMouseEnter={() => setHover(i)}
            onMouseLeave={() => setHover(null)}
          >
            <span className="w-[84px] shrink-0 text-[12px] font-medium text-muted">
              {s.label}
            </span>
            <div className="relative h-9 flex-1">
              <motion.div
                className="absolute inset-y-0 left-0 rounded-[10px]"
                style={{
                  background: `color-mix(in srgb, ${color} ${100 - i * 12}%, white)`,
                }}
                initial={{ width: 0 }}
                animate={
                  seen
                    ? {
                        width: `${Math.max(6, (s.value / max) * 100)}%`,
                        opacity: hover === null || hover === i ? 1 : 0.45,
                      }
                    : {}
                }
                transition={{
                  width: { duration: 0.9, ease: easeOut, delay: i * 0.08 },
                  opacity: { duration: 0.2 },
                }}
              />
              <span className="absolute inset-y-0 left-3 flex items-center text-[13px] font-semibold tabular-nums text-white">
                {s.value}
              </span>
            </div>
            <AnimatePresence>
              <motion.span
                key={hover === i ? "on" : "off"}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className={cn(
                  "w-[72px] shrink-0 text-right text-[11px] tabular-nums",
                  hover === i ? "font-semibold text-ink" : "text-muted",
                )}
              >
                {i === 0 ? "start" : `${conv}% kept`}
              </motion.span>
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}

/* Horizontal time bars: one row per day, the rostered shift as a track, the punch as the bar. */
export function Timeline({
  rows,
  from = 0,
  to = 24,
}: {
  rows: {
    key: string;
    label: string;
    shift?: [number, number];
    punch?: [number, number];
    flag?: "late" | "early" | "missing";
    detail: string[];
  }[];
  from?: number;
  to?: number;
}) {
  const { ref, seen } = useSeen();
  const [tip, setTip] = useState<{
    y: number;
    detail: string[];
    label: string;
  } | null>(null);
  const pct = (h: number) =>
    `${((Math.min(to, Math.max(from, h)) - from) / (to - from)) * 100}%`;
  const width = (a: number, b: number) =>
    `${((Math.min(to, b) - Math.max(from, a)) / (to - from)) * 100}%`;
  const flagColor = { late: C.amber, early: C.amber, missing: C.red };
  return (
    <div ref={ref} className="relative" onMouseLeave={() => setTip(null)}>
      <div className="mb-2 ml-[76px] flex justify-between text-[10px] text-muted">
        {[0, 6, 12, 18, 24].map((h) => (
          <span key={h}>{String(h).padStart(2, "0")}:00</span>
        ))}
      </div>
      <div className="space-y-1.5">
        {rows.map((r, i) => (
          <div
            key={r.key}
            className="flex items-center gap-2"
            onMouseEnter={(e) =>
              setTip({
                y: (e.currentTarget as HTMLElement).offsetTop,
                detail: r.detail,
                label: r.label,
              })
            }
          >
            <span className="w-[68px] shrink-0 text-[11px] font-medium text-muted">
              {r.label}
            </span>
            <div className="relative h-6 flex-1 rounded-md bg-[#f6f8fd] transition-colors hover:bg-[#eef1f8]">
              {r.shift && (
                <span
                  className="absolute inset-y-1 rounded-[5px] border border-dashed border-[#b4bccd]"
                  style={{
                    left: pct(r.shift[0]),
                    width: width(r.shift[0], r.shift[1]),
                  }}
                />
              )}
              {r.punch && (
                <motion.span
                  className="absolute inset-y-1.5 rounded-[4px]"
                  style={{
                    left: pct(r.punch[0]),
                    background: r.flag ? flagColor[r.flag] : C.green,
                    transformOrigin: "left",
                  }}
                  initial={{ width: 0 }}
                  animate={seen ? { width: width(r.punch[0], r.punch[1]) } : {}}
                  transition={{ duration: 0.7, ease: easeOut, delay: i * 0.03 }}
                />
              )}
              {r.flag === "missing" && !r.punch && (
                <span className="absolute inset-y-0 left-2 flex items-center text-[10px] font-semibold text-[#e5484d]">
                  no check-in
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
      <AnimatePresence>
        {tip && (
          <motion.div
            key="tip"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, top: tip.y + 30 }}
            exit={{ opacity: 0 }}
            transition={{ type: "spring", stiffness: 500, damping: 40 }}
            className="pointer-events-none absolute right-0 z-20 rounded-xl bg-white px-3 py-2 text-[12px] shadow-[0_8px_24px_rgba(0,0,0,0.08)] ring-1 ring-[#ebebea]"
          >
            <p className="font-semibold">{tip.label}</p>
            {tip.detail.map((d) => (
              <p key={d} className="text-muted">
                {d}
              </p>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

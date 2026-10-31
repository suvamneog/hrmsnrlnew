import { Briefcase, Moon, Sun, SunHorizon } from "@phosphor-icons/react";
import type { ComponentType } from "react";

type Icon = ComponentType<{ size?: number; weight?: "fill" | "bold" | "regular" | "duotone" }>;

/* One look for each shift everywhere it appears: a picture of the time of day, a colour that
   matches it (dawn, midday, night), the plain name and the hours. Letters alone meant nothing. */
export const SHIFT_STYLE: Record<string, { name: string; hours: string; bg: string; ink: string; bar: string; Icon?: Icon }> = {
  M: { name: "Morning", hours: "6 am to 2 pm", bg: "#ffe9a8", ink: "#8a5a00", bar: "#f2b632", Icon: SunHorizon },
  A: { name: "Afternoon", hours: "2 pm to 10 pm", bg: "#ef7d32", ink: "#ffffff", bar: "#ef7d32", Icon: Sun },
  N: { name: "Night", hours: "10 pm to 6 am", bg: "#26306b", ink: "#ffffff", bar: "#26306b", Icon: Moon },
  G: { name: "General", hours: "9 am to 5:30 pm", bg: "#e8ebff", ink: "#3d5afe", bar: "#8e8e93", Icon: Briefcase },
  OFF: { name: "Day off", hours: "", bg: "#f2f2f0", ink: "#8e8e93", bar: "#d2d2d7" },
};

export function ShiftIcon({ code, size = 14 }: { code: string; size?: number }) {
  const s = SHIFT_STYLE[code];
  return s?.Icon ? <s.Icon size={size} weight="fill" /> : null;
}

/* The key above any shift grid or calendar: icon chip, name, hours. */
export function ShiftKey({ codes = ["M", "A", "N", "OFF"] }: { codes?: string[] }) {
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-2">
      {codes.map((c) => {
        const s = SHIFT_STYLE[c];
        return (
          <span key={c} className="inline-flex items-center gap-2 text-[12px] text-muted">
            <span className="grid h-6 w-6 place-items-center rounded-[7px]" style={{ background: s.bg, color: s.ink }}>
              <ShiftIcon code={c} size={13} />
            </span>
            <span>
              <span className="font-medium text-ink">{s.name}</span>
              {s.hours && `, ${s.hours}`}
            </span>
          </span>
        );
      })}
    </div>
  );
}

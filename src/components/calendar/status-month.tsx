"use client";

import { SHIFT_STYLE, ShiftIcon } from "@/lib/shift-style";

import { Calendar, CalendarDayButton } from "@/components/ui/calendar";
import { cn } from "@/lib/cn";
import type { DayButtonProps } from "react-day-picker";
import { format, parseISO } from "date-fns";

export const ATT_DOT: Record<string, string> = {
  present: "bg-ok",
  weekly_off: "bg-faint",
  holiday: "bg-warn",
  missing_punch: "bg-danger",
  leave: "bg-brand",
  absent: "bg-danger",
  od: "bg-brand",
};

// Calendar stamps use the same shift look as the roster grid: icon on the shift's colour.
export { SHIFT_STYLE } from "@/lib/shift-style";

function StatusDayButton({
  marks,
  className,
  day,
  modifiers,
  children,
  ...props
}: DayButtonProps & { marks: Map<string, { dot?: string; stamp?: string; stampClass?: string }> }) {
  const iso = format(day.date, "yyyy-MM-dd");
  const mark = marks.get(iso);
  return (
    <CalendarDayButton
      day={day}
      modifiers={modifiers}
      className={cn("relative h-full w-full flex-col gap-0.5 rounded-xl text-[13px]", className)}
      {...props}
    >
      {children}
      {mark?.dot ? <span className={cn("h-1.5 w-1.5 rounded-full", mark.dot)} /> : null}
      {mark?.stamp ? (
        SHIFT_STYLE[mark.stamp] ? (
          <span
            title={SHIFT_STYLE[mark.stamp].name}
            className="grid h-4 min-w-4 place-items-center rounded-[5px] px-0.5 text-[9px] font-semibold"
            style={{ background: SHIFT_STYLE[mark.stamp].bg, color: SHIFT_STYLE[mark.stamp].ink }}
          >
            {SHIFT_STYLE[mark.stamp].Icon ? <ShiftIcon code={mark.stamp} size={10} /> : "Off"}
          </span>
        ) : (
          <span className={cn("rounded px-1 text-[9px] font-semibold leading-4", mark.stampClass)}>{mark.stamp}</span>
        )
      ) : null}
    </CalendarDayButton>
  );
}

export function StatusMonth({
  selected,
  onSelect,
  marks,
  month,
  className,
}: {
  selected?: string;
  onSelect: (iso: string) => void;
  marks: Map<string, { dot?: string; stamp?: string; stampClass?: string }>;
  month?: Date;
  className?: string;
}) {
  return (
    <Calendar
      mode="single"
      selected={selected ? parseISO(selected) : undefined}
      defaultMonth={month ?? (selected ? parseISO(selected) : undefined)}
      onSelect={(day) => {
        if (day) onSelect(format(day, "yyyy-MM-dd"));
      }}
      className={cn(
        "w-full [--rdp-day-height:2.85rem] [--rdp-day-width:2.85rem] [--rdp-day_button-height:2.75rem] [--rdp-day_button-width:2.75rem]",
        className,
      )}
      components={{
        DayButton: (props) => <StatusDayButton {...props} marks={marks} />,
      }}
    />
  );
}

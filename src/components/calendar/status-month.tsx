"use client";

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

export const SHIFT_TONE: Record<string, string> = {
  M: "bg-ok-soft text-ok",
  A: "bg-warn-soft text-warn",
  N: "bg-brand-soft text-brand",
  G: "bg-fill text-brand",
  OFF: "bg-fill text-muted",
};

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
        <span className={cn("rounded px-1 text-[9px] font-semibold leading-4", mark.stampClass)}>{mark.stamp}</span>
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

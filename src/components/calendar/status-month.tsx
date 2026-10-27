"use client";

import { Calendar, CalendarDayButton } from "@/components/ui/calendar";
import { cn } from "@/lib/cn";
import type { DayButtonProps } from "react-day-picker";
import { format, parseISO } from "date-fns";

export const ATT_DOT: Record<string, string> = {
  present: "bg-[#0f9f6e]",
  weekly_off: "bg-[#98a2b3]",
  holiday: "bg-[#e07a3d]",
  missing_punch: "bg-[#d13b3b]",
  leave: "bg-[#5b5bd6]",
  absent: "bg-[#d13b3b]",
  od: "bg-[#2f7ec8]",
};

export const SHIFT_TONE: Record<string, string> = {
  M: "bg-[#e7f8ef] text-[#0f9f6e]",
  A: "bg-[#fff1e6] text-[#e07a3d]",
  N: "bg-[#eeeaff] text-[#5b5bd6]",
  G: "bg-[#e8eefc] text-brand",
  OFF: "bg-[#eef1f6] text-muted",
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
      className={cn("relative h-full w-full flex-col gap-0.5 rounded-2xl text-[13px]", className)}
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

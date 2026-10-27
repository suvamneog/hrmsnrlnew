"use client";

import { cn } from "@/lib/cn";
import { DEMO_TODAY } from "@/lib/demo";
import { CaretDown, CaretLeft, CaretRight, CaretUp } from "@phosphor-icons/react";
import { parseISO } from "date-fns";
import type { ComponentProps } from "react";
import { DayPicker, type DayButtonProps } from "react-day-picker";
import "react-day-picker/style.css";

export type CalendarProps = ComponentProps<typeof DayPicker>;

function Chevron({
  className,
  orientation,
}: {
  className?: string;
  orientation?: "up" | "down" | "left" | "right";
  disabled?: boolean;
  size?: number;
}) {
  const Icon = orientation === "left" ? CaretLeft : orientation === "right" ? CaretRight : orientation === "up" ? CaretUp : CaretDown;
  return <Icon weight="bold" className={cn("size-4", className)} />;
}

export function CalendarDayButton({ className, modifiers, day: _day, ...props }: DayButtonProps) {
  return (
    <button
      type="button"
      data-selected={modifiers.selected || undefined}
      data-today={modifiers.today || undefined}
      data-range-start={modifiers.range_start || undefined}
      data-range-end={modifiers.range_end || undefined}
      data-range-middle={modifiers.range_middle || undefined}
      className={cn(
        "flex items-center justify-center rounded-full text-sm font-medium text-ink transition-colors hover:bg-brand-soft",
        modifiers.selected && "bg-brand text-white hover:bg-brand-deep hover:text-white",
        modifiers.today && !modifiers.selected && "bg-brand-soft text-brand",
        modifiers.outside && "text-muted/40",
        modifiers.disabled && "pointer-events-none opacity-40",
        (modifiers.range_start || modifiers.range_end) && "bg-brand text-white hover:bg-brand-deep",
        modifiers.range_middle && "rounded-none bg-brand-soft text-brand hover:bg-brand-soft",
        className,
      )}
      {...props}
    />
  );
}

export function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  captionLayout = "label",
  components,
  ...props
}: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      captionLayout={captionLayout}
      navLayout="around"
      animate
      weekStartsOn={1}
      today={parseISO(DEMO_TODAY)}
      className={cn(
        "p-1 [--rdp-accent-background-color:#eef1ff] [--rdp-accent-color:#3d5afe] [--rdp-today-color:#3d5afe]",
        className,
      )}
      classNames={{
        button_previous: "rdp-button_previous rounded-full text-muted hover:bg-brand-soft hover:text-ink",
        button_next: "rdp-button_next rounded-full text-muted hover:bg-brand-soft hover:text-ink",
        caption_label: "rdp-caption_label text-sm font-semibold",
        weekday: "rdp-weekday text-[11px] font-semibold uppercase tracking-wide text-muted",
        ...classNames,
      }}
      components={{
        Chevron,
        DayButton: CalendarDayButton,
        ...components,
      }}
      {...props}
    />
  );
}

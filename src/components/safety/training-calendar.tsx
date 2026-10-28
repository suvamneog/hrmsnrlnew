"use client";

import { Field, Panel, Pill, Rows } from "@/components/desk/kit";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { DEMO_TODAY } from "@/lib/demo";
import { useDesk } from "@/lib/desk";
import { formatDay } from "@/lib/format";
import { useHrms } from "@/lib/store";
import { addDays, format, parseISO } from "date-fns";
import { useState } from "react";
import { toast } from "sonner";

/* Training batches with dates and seats. "Fill" seats the people whose certificate for that
   course has lapsed or lapses before the batch plus 30 days, most overdue first. */
export function TrainingCalendar() {
  const role = useHrms((s) => s.actingRole);
  const courses = useHrms((s) => s.courses);
  const certs = useHrms((s) => s.certificates);
  const workers = useHrms((s) => s.workers);
  const employees = useHrms((s) => s.employees);
  const batches = useDesk((s) => s.batches);
  const addBatch = useDesk((s) => s.addBatch);
  const enrol = useDesk((s) => s.enrolBatch);
  const [form, setForm] = useState({ courseId: "h2s", date: format(addDays(parseISO(DEMO_TODAY), 14), "yyyy-MM-dd"), venue: "HSE classroom, admin block", seats: "20" });
  const canPlan = role === "safety_officer";
  const course = (id: string) => courses.find((c) => c.id === id)?.name ?? id;
  const person = (id: string) => workers.find((w) => w.id === id)?.name ?? employees.find((e) => e.id === id)?.name ?? id;

  const due = (courseId: string, date: string) => {
    const by = format(addDays(parseISO(date), 30), "yyyy-MM-dd");
    const taken = new Set(batches.flatMap((b) => b.enrolled));
    return certs
      .filter((c) => c.courseId === courseId && c.expires <= by && !taken.has(c.personId))
      .sort((a, b) => a.expires.localeCompare(b.expires))
      .map((c) => c.personId);
  };

  return (
    <Panel title="Training batches" note="Dates and seats for the next OISD courses. Seats go first to the most overdue holders.">
      <Rows
        items={batches.filter((b) => b.date >= DEMO_TODAY)}
        empty="No batches planned."
        render={(b) => {
          const waiting = due(b.courseId, b.date);
          const left = b.seats - b.enrolled.length;
          return (
            <div className="w-full">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-ink">{`${course(b.courseId)}, ${formatDay(b.date)}`}</p>
                  <p className="text-[12px] text-muted">{`${b.venue}. ${b.enrolled.length} of ${b.seats} seats taken, ${waiting.length} more due.`}</p>
                </div>
                {canPlan && left > 0 && waiting.length > 0 ? (
                  <Button
                    variant="secondary"
                    className="h-8 px-3 text-[13px]"
                    onClick={() => {
                      enrol(b.id, waiting.slice(0, left));
                      toast.success(`${Math.min(left, waiting.length)} seated for ${formatDay(b.date)}`);
                    }}
                  >
                    {`Fill ${Math.min(left, waiting.length)} seats`}
                  </Button>
                ) : (
                  <Pill tone={left === 0 ? "ok" : "muted"}>{left === 0 ? "Full" : `${left} seats free`}</Pill>
                )}
              </div>
              {b.enrolled.length > 0 && (
                <p className="mt-1.5 truncate text-[12px] text-muted">{`Seated: ${b.enrolled.slice(0, 6).map(person).join(", ")}${b.enrolled.length > 6 ? ` and ${b.enrolled.length - 6} more` : ""}`}</p>
              )}
            </div>
          );
        }}
      />
      {canPlan && (
        <form
          className="mt-4 grid gap-3 border-t border-line pt-4 sm:grid-cols-4 sm:items-end"
          onSubmit={(e) => {
            e.preventDefault();
            if (form.date < DEMO_TODAY || !form.venue.trim()) return toast.error("Pick a future date and a venue.");
            addBatch({ courseId: form.courseId, date: form.date, venue: form.venue.trim(), seats: Number(form.seats) || 20 });
            toast.success(`${course(form.courseId)} batch planned for ${formatDay(form.date)}`);
          }}
        >
          <Field label="Course">
            <Select value={form.courseId} onChange={(e) => setForm({ ...form, courseId: e.target.value })}>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Date">
            <Input type="date" min={DEMO_TODAY} value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
          </Field>
          <Field label="Venue">
            <Input value={form.venue} onChange={(e) => setForm({ ...form, venue: e.target.value })} />
          </Field>
          <Field label="Seats">
            <Input type="number" min={5} max={60} value={form.seats} onChange={(e) => setForm({ ...form, seats: e.target.value })} />
          </Field>
          <div className="sm:col-span-4">
            <Button type="submit">Plan batch</Button>
          </div>
        </form>
      )}
    </Panel>
  );
}

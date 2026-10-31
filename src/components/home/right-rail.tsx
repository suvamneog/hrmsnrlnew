"use client";

import { AvatarStack } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { routeAllowed } from "@/lib/access";
import { DEMO_TODAY } from "@/lib/demo";
import { useCurrentUser, useHrms } from "@/lib/store";
import { CaretLeft, CaretRight, Plus } from "@phosphor-icons/react";
import { addDays, format, parseISO } from "date-fns";
import Link from "next/link";
import { useMemo, useState } from "react";

type Tab = "shift" | "training" | "todo";

function clock(hhmm: string) {
  if (!hhmm) return "";
  const [h, m] = hhmm.split(":").map(Number);
  return format(new Date(2000, 0, 1, h, m), "h:mm a");
}

function rangeLabel(from: string, to: string) {
  const a = parseISO(from);
  const b = parseISO(to);
  if (from === to) return format(a, "d MMM yyyy");
  if (a.getFullYear() === b.getFullYear()) return `${format(a, "d MMM")} – ${format(b, "d MMM yyyy")}`;
  return `${format(a, "d MMM yyyy")} – ${format(b, "d MMM yyyy")}`;
}

function sessionTime(courseId: string) {
  if (courseId === "h2s") return "2:00 PM – 5:00 PM";
  if (courseId === "fire") return "10:00 AM – 1:00 PM";
  return "9:00 AM – 12:00 PM";
}

export function HomeRightRail() {
  const me = useCurrentUser();
  const role = useHrms((s) => s.actingRole);
  const employees = useHrms((s) => s.employees);
  const roster = useHrms((s) => s.roster);
  const shifts = useHrms((s) => s.shifts);
  const holidays = useHrms((s) => s.holidays);
  const sessions = useHrms((s) => s.sessions);
  const courses = useHrms((s) => s.courses);
  const leaves = useHrms((s) => s.leaveRequests);
  const types = useHrms((s) => s.leaveTypes);
  const candidates = useHrms((s) => s.candidates);
  const openings = useHrms((s) => s.openings);
  const [anchor, setAnchor] = useState(() => format(addDays(parseISO(DEMO_TODAY), -2), "yyyy-MM-dd"));
  const [selected, setSelected] = useState(DEMO_TODAY);
  const [tab, setTab] = useState<Tab>("shift");

  const days = useMemo(
    () => [0, 1, 2, 3, 4].map((i) => format(addDays(parseISO(anchor), i), "yyyy-MM-dd")),
    [anchor],
  );

  const marked = useMemo(() => {
    const set = new Set<string>();
    for (const h of holidays) set.add(h.date);
    for (const s of sessions) set.add(s.date);
    for (const l of leaves) {
      if (l.status === "rejected") continue;
      let d = parseISO(l.from);
      const end = parseISO(l.to);
      while (d <= end) {
        set.add(format(d, "yyyy-MM-dd"));
        d = addDays(d, 1);
      }
    }
    return set;
  }, [holidays, sessions, leaves]);

  if (!me) return null;

  const teamIds = new Set(employees.filter((e) => e.managerId === me.id).map((e) => e.id));
  const leaveInbox = leaves.filter((l) => l.status === "pending" && (l.approverId === me.id || teamIds.has(l.employeeId)));
  // Your own leave still to come; requests waiting on you are in the Inbox and the Today list.
  const leaveRows = leaves
    .filter((l) => l.employeeId === me.id && (l.status === "pending" || l.status === "approved") && l.to >= DEMO_TODAY)
    .sort((a, b) => a.from.localeCompare(b.from))
    .slice(0, 3);

  const myRoster = roster.find((r) => r.employeeId === me.id && r.date === selected);
  const shift = shifts.find((s) => s.id === (myRoster?.shiftId ?? (me.crew ? undefined : "G")));
  const mates = roster
    .filter((r) => r.date === selected && r.shiftId === (myRoster?.shiftId ?? shift?.id) && r.employeeId !== me.id && !r.employeeId.startsWith("g-"))
    .slice(0, 3)
    .flatMap((r) => {
      const e = employees.find((x) => x.id === r.employeeId);
      return e ? [e.name] : [];
    });

  const training = sessions
    .filter((s) => s.date >= selected)
    .slice(0, 3)
    .map((s) => {
      const course = courses.find((c) => c.id === s.courseId);
      const names = s.enrolled.flatMap((id) => {
        const e = employees.find((x) => x.id === id);
        return e ? [e.name] : [];
      });
      return {
        id: s.id,
        title: course?.name ?? "Training",
        when: sessionTime(s.courseId),
        meta: format(parseISO(s.date), "d MMM"),
        names: names.length ? names : [me.name],
        href: "/safety",
      };
    });

  const interviews =
    role === "recruiter" || role === "hr_admin"
      ? candidates
          .filter((c) => c.stage === "interview" || c.stage === "medical")
          .slice(0, 2)
          .map((c) => ({
            id: c.id,
            title: openings.find((o) => o.id === c.openingId)?.post ?? "Interview",
            when: c.stage === "interview" ? "10:00 AM – 1:00 PM" : "Medical, 9:00 AM",
            meta: c.name,
            names: [c.name],
            href: "/recruitment",
          }))
      : [];

  // Only things this person has to act on: approvals, then their own open requests and enrolled training.
  const todos = [
    ...leaveInbox.slice(0, 2).map((l) => {
      const who = employees.find((e) => e.id === l.employeeId);
      return {
        id: l.id,
        title: `${who?.preferredName ?? "Leave"}, ${types.find((t) => t.id === l.typeId)?.code ?? ""}`,
        when: rangeLabel(l.from, l.to),
        meta: "Approve",
        names: who ? [who.name] : [],
        href: "/approvals",
      };
    }),
    ...leaves
      .filter((l) => l.employeeId === me.id && l.status === "pending")
      .slice(0, 2)
      .map((l) => ({
        id: l.id,
        title: `Your ${types.find((t) => t.id === l.typeId)?.name.toLowerCase() ?? "leave"}`,
        when: rangeLabel(l.from, l.to),
        meta: "Awaiting approval",
        names: [] as string[],
        href: "/leave",
      })),
    ...sessions
      .filter((s) => s.date >= selected && s.enrolled.includes(me.id))
      .slice(0, 1)
      .map((s) => ({
        id: s.id,
        title: `Attend ${courses.find((c) => c.id === s.courseId)?.name ?? "training"}`,
        when: sessionTime(s.courseId),
        meta: format(parseISO(s.date), "d MMM"),
        names: [] as string[],
        href: "/safety",
      })),
  ].slice(0, 3);

  const events =
    tab === "shift"
      ? shift
        ? [
            {
              id: "shift",
              title: shift.label,
              when: shift.start ? `${clock(shift.start)} – ${clock(shift.end)}` : "Off roster",
              meta: selected === DEMO_TODAY ? "Today" : format(parseISO(selected), "EEE"),
              names: [me.name, ...mates].slice(0, 4),
              href: routeAllowed("/roster", role) ? "/roster" : "/time",
            },
          ]
        : []
      : tab === "training"
        ? [...interviews, ...training].slice(0, 3)
        : todos;

  const links = [
    { href: "/contractors", label: "Contract labour" },
    { href: "/gate", label: "Gate" },
    { href: "/safety", label: "Safety" },
    { href: "/recruitment", label: "Recruitment" },
    { href: "/people", label: "People" },
    { href: "/leave", label: "Leave" },
    { href: routeAllowed("/roster", role) ? "/roster" : "/time", label: "Shifts" },
    { href: routeAllowed("/reports", role) ? "/reports" : "/payslips", label: routeAllowed("/reports", role) ? "Reports" : "Payslips" },
  ]
    .filter((l) => routeAllowed(l.href, role))
    .slice(0, 4);

  const addHref = routeAllowed("/leave", role) ? "/leave" : "/home";

  return (
    <aside className="space-y-4 lg:sticky lg:top-20">
      <Card className="p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-semibold">Calendar</h2>
          {routeAllowed("/leave", role) && (
            <Link
              href={addHref}
              className="grid h-8 w-8 hit place-items-center rounded-full bg-brand text-white"
              aria-label="Apply leave"
            >
              <Plus size={16} weight="bold" />
            </Link>
          )}
        </div>
        <div className="mb-3 flex items-center justify-between text-sm">
          <button
            type="button"
            className="grid h-7 w-7 hit place-items-center rounded-full text-muted hover:bg-brand-soft hover:text-ink"
            onClick={() => setAnchor(format(addDays(parseISO(anchor), -5), "yyyy-MM-dd"))}
            aria-label="Previous days"
          >
            <CaretLeft size={16} weight="bold" />
          </button>
          <p className="font-semibold">{format(parseISO(selected), "MMMM, yyyy")}</p>
          <button
            type="button"
            className="grid h-7 w-7 hit place-items-center rounded-full text-muted hover:bg-brand-soft hover:text-ink"
            onClick={() => setAnchor(format(addDays(parseISO(anchor), 5), "yyyy-MM-dd"))}
            aria-label="Next days"
          >
            <CaretRight size={16} weight="bold" />
          </button>
        </div>
        <div className="grid grid-cols-5 gap-1">
          {days.map((iso) => {
            const on = iso === selected;
            const today = iso === DEMO_TODAY;
            return (
              <button
                key={iso}
                type="button"
                onClick={() => setSelected(iso)}
                className="relative flex flex-col items-center gap-1 py-1"
              >
                <span className="text-[12px] font-medium text-muted">{format(parseISO(iso), "EEE")}</span>
                <span
                  className={`relative grid h-8 w-8 place-items-center rounded-xl text-sm font-semibold ${
                    on ? "bg-brand-soft text-brand" : today ? "text-brand" : "text-ink"
                  }`}
                >
                  {format(parseISO(iso), "d")}
                  {marked.has(iso) && (
                    <span className="absolute -right-0.5 -top-0.5 h-1.5 w-1.5 rounded-full bg-danger" />
                  )}
                </span>
                <span className={`h-0.5 w-6 rounded-full ${on ? "bg-brand" : "bg-transparent"}`} />
              </button>
            );
          })}
        </div>
        <div className="mt-2 flex gap-4 border-b border-line px-1">
          {(
            [
              ["shift", "Shift"],
              ["training", "Training"],
              ["todo", "To-do"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={`-mb-px pb-2 text-[13px] font-semibold ${
                tab === id ? "border-b-2 border-brand text-ink" : "border-b-2 border-transparent text-muted"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="mt-3 space-y-2">
          {events.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted">{tab === "todo" ? "Nothing to do. You are all caught up." : "Nothing on this day."}</p>
          ) : (
            events.map((ev) => (
              <Link key={ev.id} href={ev.href} className="block rounded-xl bg-subtle px-3 py-2.5 transition hover:bg-brand-soft">
                <p className="truncate text-sm font-semibold">{ev.title}</p>
                <div className="mt-1.5 flex items-center justify-between gap-2">
                  {ev.names.length > 0 ? <AvatarStack names={ev.names} /> : <span className="text-[12px] text-muted">{ev.meta}</span>}
                  <p className="text-[12px] text-muted">{ev.when}</p>
                </div>
              </Link>
            ))
          )}
        </div>
      </Card>

      {/* Contractor supervisors are not NRL staff and have no leave here. */}
      {role !== "contractor_supervisor" && (
      <Card className="p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-semibold">Your leave</h2>
          <Link href="/leave" className="text-xs font-semibold text-brand">
            Apply
          </Link>
        </div>
        {leaveRows.length === 0 ? (
          <p className="py-3 text-sm text-muted">No leave booked.</p>
        ) : (
          <ul className="space-y-3">
            {leaveRows.map((l) => (
              <li key={l.id}>
                <Link href="/leave" className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{types.find((t) => t.id === l.typeId)?.name ?? "Leave"}</p>
                    <p className="text-[12px] text-muted">{rangeLabel(l.from, l.to)}</p>
                  </div>
                  <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-[12px] font-semibold ${l.status === "approved" ? "bg-ok-soft text-ok" : "bg-warn-soft text-[#8a5600]"}`}>
                    {l.status === "approved" ? "Approved" : "Waiting"}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Card>
      )}

      {links.length > 0 && (
        <Card className="p-4">
          <h2 className="mb-1 font-semibold">Quick links</h2>
          <ul>
            {links.map((l) => (
              <li key={l.href}>
                <Link
                  href={l.href}
                  className="flex items-center justify-between py-2.5 text-sm font-medium text-ink hover:text-brand"
                >
                  {l.label}
                  <CaretRight size={14} weight="bold" className="text-muted" />
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </aside>
  );
}

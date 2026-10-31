"use client";

import { LanguageSwitch } from "@/components/i18n/language-switch";
import { DEMO_TODAY } from "@/lib/demo";
import { useDesk } from "@/lib/desk";
import { downloadPdf } from "@/lib/files";
import { formatDay, inr, monthLabel } from "@/lib/format";
import { easeOut, spring } from "@/lib/motion";
import { useHrms } from "@/lib/store";
import type { Employee } from "@/lib/types";
import { Backspace, CalendarCheck, ChatCircleText, Clock, FileText, SignOut, UmbrellaSimple } from "@phosphor-icons/react";
import { addDays, format, parseISO } from "date-fns";
import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

const IDLE_SECONDS = 60;
type Screen = "home" | "attendance" | "leave" | "payslip" | "help";

const STATUS: Record<string, string> = {
  present: "Present",
  absent: "Absent",
  leave: "On leave",
  weekly_off: "Weekly off",
  holiday: "Holiday",
  missing_punch: "No check-in",
  od: "On duty",
};

const HELP = ["Pay or allowance query", "Leave balance looks wrong", "No check-in", "Quarter repair", "Medical referral"];

/* A shared touch screen at the plant gate or canteen for staff without a phone or desk.
   Sign in with employee number and birth year; it signs out by itself after a minute idle. */
export default function KioskPage() {
  const employees = useHrms((s) => s.employees);
  const hydrated = useHrms((s) => s.hydrated);
  const [who, setWho] = useState<Employee | null>(null);
  const [assisted, setAssisted] = useState(false);
  const [screen, setScreen] = useState<Screen>("home");
  const [left, setLeft] = useState(IDLE_SECONDS);
  const last = useRef(0);

  const end = useCallback(() => {
    setWho(null);
    setScreen("home");
    setAssisted(false);
  }, []);

  // Idle timer: any touch resets it; at zero the kiosk returns to the sign-in pad.
  useEffect(() => {
    if (!who) return;
    last.current = Date.now();
    const touch = () => (last.current = Date.now());
    window.addEventListener("pointerdown", touch);
    window.addEventListener("keydown", touch);
    const id = setInterval(() => {
      const remain = IDLE_SECONDS - Math.floor((Date.now() - last.current) / 1000);
      setLeft(remain);
      if (remain <= 0) end();
    }, 1000);
    return () => {
      clearInterval(id);
      window.removeEventListener("pointerdown", touch);
      window.removeEventListener("keydown", touch);
    };
  }, [who, end]);

  return (
    <div className="min-h-[100dvh] bg-fill text-ink">
      <header className="flex flex-wrap items-center justify-between gap-4 px-6 py-5 md:px-10">
        <div className="flex items-center gap-3">
          <span className="grid h-12 w-12 place-items-center rounded-xl bg-brand text-lg font-bold text-white">N</span>
          <div>
            <p className="text-lg font-semibold leading-tight">NRL People</p>
            <p className="text-sm text-muted">Kiosk</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <LanguageSwitch large />
          {who && (
            <button type="button" onClick={end} className="inline-flex h-12 items-center gap-2 rounded-lg bg-white px-5 text-base font-semibold">
              <SignOut size={20} />
              Done
            </button>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 pb-10 md:px-10">
        <AnimatePresence mode="wait">
          {!hydrated ? null : !who ? (
            <SignIn key="pad" employees={employees} onIn={(e) => setWho(e)} />
          ) : (
            <motion.div key={`${who.id}-${screen}`} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.35, ease: easeOut }}>
              <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
                <div>
                  <h1 className="text-[34px] font-semibold tracking-tight">{`Namaskar, ${who.preferredName}`}</h1>
                  <p className="mt-1 text-base text-muted">
                    {`Signs out in ${left} s if nobody touches the screen.`}
                  </p>
                </div>
                <label className="inline-flex cursor-pointer items-center gap-3 rounded-lg bg-white px-5 py-3 text-base font-medium">
                  <input type="checkbox" className="h-5 w-5 accent-[var(--brand)]" checked={assisted} onChange={(e) => setAssisted(e.target.checked)} />
                  Someone is helping me
                </label>
              </div>
              {screen === "home" ? (
                <Tiles onPick={setScreen} />
              ) : (
                <div>
                  <button type="button" onClick={() => setScreen("home")} className="mb-5 inline-flex h-12 items-center rounded-lg bg-white px-6 text-base font-semibold">
                    Back
                  </button>
                  {screen === "attendance" && <Attendance who={who} />}
                  {screen === "leave" && <LeaveScreen who={who} assisted={assisted} />}
                  {screen === "payslip" && <Payslip who={who} />}
                  {screen === "help" && <Help who={who} assisted={assisted} onDone={() => setScreen("home")} />}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

function SignIn({ employees, onIn }: { employees: Employee[]; onIn: (e: Employee) => void }) {
  const [step, setStep] = useState<"id" | "pin">("id");
  const [id, setId] = useState("");
  const [pin, setPin] = useState("");
  const value = step === "id" ? id : pin;
  const set = step === "id" ? setId : setPin;
  const max = step === "id" ? 3 : 4;

  function next() {
    if (step === "id") {
      if (id.length < 3) return toast.error("Enter the last three digits of your employee number.");
      setStep("pin");
      return;
    }
    const person = employees.find((e) => !e.id.startsWith("g-") && e.cadre !== "contract" && e.empNo.endsWith(`/${id}`));
    if (!person || person.dob.slice(0, 4) !== pin) {
      toast.error("Employee number or birth year does not match.");
      setPin("");
      return;
    }
    onIn(person);
  }

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.35, ease: easeOut }} className="mx-auto max-w-md">
      <h1 className="text-center text-[30px] font-semibold tracking-tight">{step === "id" ? "Enter your employee number" : "Enter your birth year"}</h1>
      <p className="mt-2 text-center text-base text-muted">{step === "id" ? "The last three digits, for example 077" : "Four digits, for example 1983"}</p>
      <div className="mt-8 flex justify-center gap-3" aria-live="polite">
        {Array.from({ length: max }, (_, i) => (
          <span key={i} className="grid h-16 w-14 place-items-center rounded-xl bg-white text-[28px] font-semibold tabular-nums">
            {step === "pin" ? (value[i] ? "•" : "") : value[i] ?? ""}
          </span>
        ))}
      </div>
      <div className="mt-8 grid grid-cols-3 gap-3">
        {["1", "2", "3", "4", "5", "6", "7", "8", "9", "back", "0", "ok"].map((k) => (
          <motion.button
            key={k}
            type="button"
            whileTap={{ scale: 0.95 }}
            transition={spring}
            onClick={() => (k === "back" ? set(value.slice(0, -1)) : k === "ok" ? next() : value.length < max && set(value + k))}
            aria-label={k === "back" ? "Delete" : k === "ok" ? "Next" : k}
            className={`grid h-[76px] place-items-center rounded-xl text-[28px] font-semibold ${k === "ok" ? "bg-brand text-white" : "bg-white"}`}
          >
            {k === "back" ? <Backspace size={28} /> : k === "ok" ? <span className="text-xl">{step === "id" ? "Next" : "Open"}</span> : k}
          </motion.button>
        ))}
      </div>
      {step === "pin" && (
        <button type="button" className="mx-auto mt-6 block text-base font-semibold text-brand" onClick={() => (setStep("id"), setPin(""))}>
          Back
        </button>
      )}
      <p className="mt-10 text-center text-sm text-muted">
        Demo: Bikash is 077 with 1983. <Link href="/" className="font-semibold text-brand">Staff login</Link>
      </p>
    </motion.div>
  );
}

function Tiles({ onPick }: { onPick: (s: Screen) => void }) {
  const tiles: { id: Screen; label: string; icon: React.ReactNode; tone: string }[] = [
    { id: "attendance", label: "My attendance", icon: <Clock size={40} weight="duotone" />, tone: "bg-ok-soft text-ok" },
    { id: "leave", label: "My leave", icon: <UmbrellaSimple size={40} weight="duotone" />, tone: "bg-brand-soft text-brand" },
    { id: "payslip", label: "My payslip", icon: <FileText size={40} weight="duotone" />, tone: "bg-brand-soft text-brand" },
    { id: "help", label: "Ask HR for help", icon: <ChatCircleText size={40} weight="duotone" />, tone: "bg-warn-soft text-[#c25f1f]" },
  ];
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {tiles.map((t) => (
        <motion.button
          key={t.id}
          type="button"
          whileTap={{ scale: 0.97 }}
          transition={spring}
          onClick={() => onPick(t.id)}
          className="flex min-h-[150px] items-center gap-5 rounded-xl bg-white p-7 text-left border border-line"
        >
          <span className={`grid h-20 w-20 shrink-0 place-items-center rounded-xl ${t.tone}`}>{t.icon}</span>
          <span className="text-[24px] font-semibold tracking-tight">{t.label}</span>
        </motion.button>
      ))}
    </div>
  );
}

const Box = ({ children }: { children: React.ReactNode }) => <section className="rounded-xl bg-white p-6 border border-line md:p-8">{children}</section>;

function Attendance({ who }: { who: Employee }) {
  const attendance = useHrms((s) => s.attendance);
  const days = attendance.filter((a) => a.employeeId === who.id && a.date <= DEMO_TODAY).sort((a, b) => b.date.localeCompare(a.date)).slice(0, 7);
  return (
    <Box>
      <h2 className="mb-4 text-[24px] font-semibold">Last 7 days</h2>
      <ul className="divide-y divide-fill">
        {days.map((d) => (
          <li key={d.date} className="flex items-center justify-between gap-4 py-4 text-lg">
            <span>{format(parseISO(d.date), "EEE d MMM")}</span>
            <span className={d.status === "present" ? "font-semibold text-ok" : d.status === "missing_punch" ? "font-semibold text-danger" : "text-muted"}>
              {STATUS[d.status] ?? d.status}
            </span>
          </li>
        ))}
        {days.length === 0 && <li className="py-6 text-lg text-muted">No record.</li>}
      </ul>
    </Box>
  );
}

function LeaveScreen({ who, assisted }: { who: Employee; assisted: boolean }) {
  const balances = useHrms((s) => s.leaveBalances);
  const types = useHrms((s) => s.leaveTypes);
  const requests = useHrms((s) => s.leaveRequests);
  const applyLeave = useHrms((s) => s.applyLeave);
  const login = useHrms((s) => s.login);
  const mine = balances.filter((b) => b.employeeId === who.id && b.balance > 0);
  const roster = useHrms((s) => s.roster);
  // The next day this person is rostered to work, skipping weekly offs.
  const tomorrow =
    Array.from({ length: 14 }, (_, i) => format(addDays(parseISO(DEMO_TODAY), i + 1), "yyyy-MM-dd")).find((d) => {
      const r = roster.find((x) => x.employeeId === who.id && x.date === d);
      return !r || r.shiftId !== "OFF";
    }) ?? format(addDays(parseISO(DEMO_TODAY), 1), "yyyy-MM-dd");
  const name = (id: string) => types.find((t) => t.id === id)?.name ?? id;
  const open = requests.filter((r) => r.employeeId === who.id && r.status === "pending");

  function casualTomorrow() {
    // The store files leave for the signed-in user, so the kiosk acts as this person for one call.
    const prev = useHrms.getState();
    const back = { id: prev.currentUserId, role: prev.actingRole };
    login(who.id, "employee");
    const r = applyLeave({ typeId: "cl", from: tomorrow, to: tomorrow, reason: assisted ? "Applied at kiosk with help" : "Applied at kiosk" });
    if (back.id && back.role) login(back.id, back.role);
    else useHrms.getState().logout();
    if (r.ok) toast.success(`Casual leave for ${formatDay(tomorrow)} sent for approval`);
    else toast.error(r.reason ?? "Could not apply");
  }

  return (
    <div className="grid gap-4">
      <Box>
        <h2 className="mb-4 text-[24px] font-semibold">Leave left</h2>
        <div className="grid gap-3 sm:grid-cols-3">
          {mine.map((b) => (
            <div key={b.typeId} className="rounded-xl bg-subtle p-5">
              <p className="text-base text-muted">{name(b.typeId)}</p>
              <p className="mt-1 text-[36px] font-semibold leading-none tabular-nums">{b.balance}</p>
            </div>
          ))}
        </div>
      </Box>
      <Box>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-[24px] font-semibold">Casual leave, next working day</h2>
            <p className="mt-1 text-base text-muted">{`${formatDay(tomorrow)}. Goes to your manager.`}</p>
          </div>
          <motion.button whileTap={{ scale: 0.96 }} transition={spring} type="button" onClick={casualTomorrow} className="inline-flex h-14 items-center gap-2 rounded-lg bg-brand px-7 text-lg font-semibold text-white">
            <CalendarCheck size={22} />
            Apply
          </motion.button>
        </div>
        {open.length > 0 && (
          <p className="mt-4 text-base text-muted">
            {`${open.length} waiting for approval`}
          </p>
        )}
      </Box>
    </div>
  );
}

function Payslip({ who }: { who: Employee }) {
  const runs = useHrms((s) => s.payrollRuns);
  const run = runs.find((r) => r.stage === "publish" && r.results.some((x) => x.employeeId === who.id));
  const slip = run?.results.find((x) => x.employeeId === who.id);
  if (!run || !slip) return <Box><p className="text-lg text-muted">No payslip published yet</p></Box>;
  return (
    <Box>
      <p className="text-lg text-muted">{monthLabel(run.month)}</p>
      <p className="mt-2 text-base text-muted">Net pay</p>
      <p className="text-[48px] font-semibold leading-none tracking-[-0.03em] tabular-nums">{inr(slip.net)}</p>
      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl bg-subtle p-5">
          <p className="text-base text-muted">Earnings</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums">{inr(slip.gross)}</p>
        </div>
        <div className="rounded-xl bg-subtle p-5">
          <p className="text-base text-muted">Deductions</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums">{inr(slip.deductions)}</p>
        </div>
      </div>
      <motion.button
        whileTap={{ scale: 0.96 }}
        transition={spring}
        type="button"
        onClick={() =>
          downloadPdf(`payslip-${who.preferredName.toLowerCase()}-${run.month}`, [
            "Numaligarh Refinery Limited",
            `Payslip ${monthLabel(run.month)}`,
            `${who.name}  ${who.empNo}`,
            "",
            ...slip.lines.filter((l) => l.amount && l.type !== "employer").map((l) => `${l.label.padEnd(36)} ${inr(l.amount)}`),
            "",
            `Net pay ${inr(slip.net)}`,
          ])
        }
        className="mt-6 inline-flex h-14 items-center gap-2 rounded-lg bg-brand px-7 text-lg font-semibold text-white"
      >
        <FileText size={22} />
        Print payslip
      </motion.button>
    </Box>
  );
}

function Help({ who, assisted, onDone }: { who: Employee; assisted: boolean; onDone: () => void }) {
  const raise = useDesk((s) => s.raiseCase);
  return (
    <Box>
      <h2 className="mb-2 text-[24px] font-semibold">What do you need help with?</h2>
      <p className="mb-5 text-base text-muted">HR calls you back within two working days.</p>
      <div className="grid gap-3 sm:grid-cols-2">
        {HELP.map((h) => (
          <motion.button
            key={h}
            whileTap={{ scale: 0.97 }}
            transition={spring}
            type="button"
            onClick={() => {
              raise({ kind: h === "Medical referral" ? "medical" : "helpdesk", raisedBy: who.id, subject: h, detail: assisted ? "Raised at kiosk with help." : "Raised at kiosk.", confidential: h === "Medical referral" });
              toast.success("Sent to HR");
              onDone();
            }}
            className="min-h-[76px] rounded-xl bg-subtle px-5 text-left text-lg font-medium"
          >
            {h}
          </motion.button>
        ))}
      </div>
    </Box>
  );
}

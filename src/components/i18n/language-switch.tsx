"use client";

import { cn } from "@/lib/cn";
import { LOCALES } from "@/lib/i18n";
import { spring } from "@/lib/motion";
import { useHrms } from "@/lib/store";
import { useLocale } from "./use-locale";
import { motion } from "motion/react";
import { useId } from "react";

/* English, Hindi, Assamese. Each label is written in its own script and never translated. */
export function LanguageSwitch({ className, large, onDark, names }: { className?: string; large?: boolean; onDark?: boolean; names?: "english" }) {
  const locale = useLocale();
  const setLocale = useHrms((s) => s.setLocale);
  // Each switch animates its own highlight, even when several are on one page.
  const pill = useId();
  return (
    <div data-no-translate role="radiogroup" aria-label="Language" className={cn("inline-flex shrink-0 rounded-full p-1", onDark ? "bg-white/15" : "bg-white", className)}>
      {LOCALES.map((l) => {
        const on = locale === l.id;
        return (
          <button
            key={l.id}
            type="button"
            role="radio"
            aria-checked={on}
            title={l.label}
            onClick={() => setLocale(l.id)}
            className={cn(
              "relative rounded-full font-semibold transition-colors",
              large || names ? "px-4 py-2 text-[17px]" : "px-3 py-1.5 text-[13px]",
              onDark ? (on ? "text-brand" : "text-white/80 hover:text-white") : on ? "text-white" : "text-muted hover:text-ink",
            )}
          >
            {on && <motion.span layoutId={`lang-${pill}`} transition={spring} className={cn("absolute inset-0 rounded-full", onDark ? "bg-white" : "bg-brand")} />}
            <span className="relative">{names === "english" ? (l.id === "en" ? "EN" : l.label) : large ? l.native : l.id === "en" ? "EN" : l.native.slice(0, 2)}</span>
          </button>
        );
      })}
    </div>
  );
}

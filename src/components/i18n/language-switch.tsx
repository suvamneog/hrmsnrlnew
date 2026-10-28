"use client";

import { cn } from "@/lib/cn";
import { LOCALES } from "@/lib/i18n";
import { spring } from "@/lib/motion";
import { useHrms } from "@/lib/store";
import { useLocale } from "./use-locale";
import { motion } from "motion/react";

/* English, Hindi, Assamese. Each label is written in its own script and never translated. */
export function LanguageSwitch({ className, large }: { className?: string; large?: boolean }) {
  const locale = useLocale();
  const setLocale = useHrms((s) => s.setLocale);
  return (
    <div data-no-translate role="radiogroup" aria-label="Language" className={cn("inline-flex shrink-0 rounded-full bg-white p-1", className)}>
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
              large ? "px-5 py-2.5 text-base" : "px-3 py-1.5 text-[13px]",
              on ? "text-white" : "text-muted hover:text-ink",
            )}
          >
            {on && <motion.span layoutId={large ? "lang-lg" : "lang"} transition={spring} className="absolute inset-0 rounded-full bg-brand" />}
            <span className="relative">{large ? l.native : l.id === "en" ? "EN" : l.native.slice(0, 2)}</span>
          </button>
        );
      })}
    </div>
  );
}

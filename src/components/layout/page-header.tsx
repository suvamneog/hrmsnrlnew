"use client";

import { TextEffect } from "@/components/motion-primitives/text-effect";
import { InView } from "@/components/motion/in-view";
import { t } from "@/lib/i18n";
import { useLocale } from "@/components/i18n/use-locale";

export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}) {
  // The title animates word by word, so it is translated whole before it is split.
  const locale = useLocale();
  return (
    <InView className="mb-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
      <div className="min-w-0">
        <TextEffect as="h1" per="word" preset="fade-in-blur" speedReveal={1.4} className="text-[28px] font-semibold tracking-tight text-ink">
          {t(title, locale)}
        </TextEffect>
        {subtitle && <p className="mt-1 max-w-2xl text-sm text-muted">{subtitle}</p>}
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap gap-2">{actions}</div> : null}
    </InView>
  );
}

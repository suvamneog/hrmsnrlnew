"use client";

import { GlowingEffect } from "@/components/aceternity/glowing-effect";
import { ArrowUpRight } from "@phosphor-icons/react";
import Link from "next/link";
import type { ReactNode } from "react";

/* Lead card for a page: small brand eyebrow, a one-line headline, an optional link out, then the visual. */
export function HeroCard({
  eyebrow,
  title,
  href,
  cta,
  action,
  children,
}: {
  eyebrow: string;
  title: string;
  href?: string;
  cta?: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="relative rounded-[22px] bg-white p-6 shadow-[0_1px_2px_rgba(27,33,64,0.04),0_12px_32px_rgba(45,64,180,0.07)] ring-1 ring-[#e9ecf4] sm:p-7">
      <GlowingEffect spread={42} glow disabled={false} proximity={72} inactiveZone={0.05} borderWidth={2} movementDuration={1.4} />
      <div className="relative">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-brand">{eyebrow}</p>
          <h2 className="mt-1.5 text-[22px] font-semibold tracking-[-0.02em] text-ink">{title}</h2>
        </div>
        {action}
        {href && cta && (
        <Link
          href={href}
          className="group inline-flex shrink-0 items-center gap-1 rounded-full bg-[#f3f5fb] px-3.5 py-1.5 text-[12px] font-semibold text-ink transition hover:bg-brand hover:text-white"
        >
          {cta}
          <ArrowUpRight size={12} weight="bold" className="transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </Link>
        )}
      </div>
      {children}
      </div>
    </div>
  );
}


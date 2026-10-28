import { ArrowUpRight } from "@phosphor-icons/react";
import Link from "next/link";
import type { ReactNode } from "react";

/* Lead card for a page: a one-line title, an optional link out, then the content. */
export function HeroCard({
  title,
  href,
  cta,
  action,
  children,
}: {
  title: string;
  href?: string;
  cta?: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="rounded-xl border border-line bg-white p-5 sm:p-6">
      <div className="mb-5 flex items-start justify-between gap-4">
        <h2 className="text-[18px] font-semibold tracking-tight text-ink">{title}</h2>
        {action}
        {href && cta && (
          <Link href={href} className="inline-flex shrink-0 items-center gap-1 text-[13px] font-medium text-brand hover:underline">
            {cta}
            <ArrowUpRight size={12} />
          </Link>
        )}
      </div>
      {children}
    </section>
  );
}

"use client";

import { DownloadSimple } from "@phosphor-icons/react";

export type DocumentItem = { id: string; title: string; subtitle?: string; onOpen?: () => void; openLabel?: string };

/* A titled list of documents, one row each with a download action. */
export function DocumentList({ title, items }: { title: string; items: DocumentItem[] }) {
  return (
    <section className="rounded-xl border border-line bg-white">
      <h2 className="border-b border-line px-5 py-3.5 text-[15px] font-semibold text-ink">{title}</h2>
      <ul className="divide-y divide-line">
        {items.map((d) => (
          <li key={d.id} className="flex items-center justify-between gap-3 px-5 py-3">
            <span className="min-w-0">
              <span className="block truncate text-sm font-medium text-ink">{d.title}</span>
              {d.subtitle && <span className="block truncate text-[12px] text-muted">{d.subtitle}</span>}
            </span>
            {d.onOpen && (
              <button type="button" onClick={d.onOpen} className="inline-flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[13px] font-medium text-brand hover:bg-brand-soft">
                <DownloadSimple size={15} />
                {d.openLabel ?? "Download"}
              </button>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}

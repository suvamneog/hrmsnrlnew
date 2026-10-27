"use client";

import { cn } from "@/lib/cn";
import type { ButtonHTMLAttributes } from "react";

export type FileKind = "pdf" | "xls" | "txt";

const TONE: Record<FileKind, { fill: string; fold: string; label: string }> = {
  pdf: { fill: "#e4563c", fold: "#f4b0a4", label: "PDF" },
  xls: { fill: "#2ea44f", fold: "#8ed6a2", label: "XLS" },
  txt: { fill: "#64748b", fold: "#94a3b8", label: "TXT" },
};

export function fileKindFromName(name: string): FileKind {
  const lower = name.toLowerCase();
  if (lower.endsWith(".pdf")) return "pdf";
  if (lower.endsWith(".txt")) return "txt";
  return "xls";
}

function FileTypeIcon({ kind }: { kind: FileKind }) {
  const { fill, fold, label } = TONE[kind];
  return (
    <span className="relative h-11 w-9 shrink-0" aria-hidden>
      <svg viewBox="0 0 36 44" className="h-11 w-9 drop-shadow-[0_1px_1px_rgba(27,33,64,0.12)]">
        <path
          d="M4 4.8A3.8 3.8 0 0 1 7.8 1H21.5L33 12.5V39.2A3.8 3.8 0 0 1 29.2 43H7.8A3.8 3.8 0 0 1 4 39.2V4.8Z"
          fill={fill}
        />
        <path d="M21.5 1V8.7A3.8 3.8 0 0 0 25.3 12.5H33L21.5 1Z" fill={fold} />
      </svg>
      <span className="pointer-events-none absolute inset-x-0 bottom-[7px] text-center text-[8px] font-bold tracking-[0.14em] text-white">
        {label}
      </span>
    </span>
  );
}

export function FileDownload({
  name,
  size,
  kind,
  className,
  ...props
}: {
  name: string;
  size: string;
  kind: FileKind;
} & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      className={cn(
        "flex w-full items-center gap-3.5 py-3 text-left transition-opacity hover:opacity-90",
        className,
      )}
      {...props}
    >
      <FileTypeIcon kind={kind} />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[15px] font-semibold leading-tight text-ink">{name}</span>
        <span className="mt-0.5 block text-[13px] text-muted">{size}</span>
      </span>
      <span className="shrink-0 text-[15px] font-medium text-[#2f80ed]">Download</span>
    </button>
  );
}

export function FileDownloadList({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return <div className={cn("flex flex-col", className)}>{children}</div>;
}

"use client";

import { cn } from "@/lib/cn";
import type { ReactNode } from "react";

export function PassTicket({
  children,
  tone = "ok",
  className,
}: {
  children: ReactNode;
  tone?: "ok" | "no";
  className?: string;
}) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl bg-white shadow-[0_12px_28px_rgba(45,64,180,0.1)]",
        className,
      )}
    >
      <div
        className="pointer-events-none absolute inset-y-0 left-0 w-3"
        style={{
          background:
            "radial-gradient(circle at 0 14px, var(--bg) 7px, transparent 8px) 0 8px / 14px 22px repeat-y",
        }}
      />
      <div
        className="pointer-events-none absolute inset-y-0 right-0 w-3"
        style={{
          background:
            "radial-gradient(circle at 14px 14px, var(--bg) 7px, transparent 8px) 0 8px / 14px 22px repeat-y",
        }}
      />
      <div className={cn("h-1.5", tone === "ok" ? "bg-[#12a56f]" : "bg-[#e14b4b]")} />
      <div className="px-6 py-5">{children}</div>
    </div>
  );
}

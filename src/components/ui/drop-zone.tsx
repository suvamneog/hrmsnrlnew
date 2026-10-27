"use client";

import { cn } from "@/lib/cn";
import { motion, useReducedMotion } from "motion/react";
import { useRef, useState } from "react";

export function DropZone({
  label,
  hint,
  files,
  onFiles,
  accept,
}: {
  label: string;
  hint?: string;
  files: File[];
  onFiles: (files: File[]) => void;
  accept?: string;
}) {
  const reduce = useReducedMotion();
  const input = useRef<HTMLInputElement>(null);
  const box = useRef<HTMLButtonElement>(null);
  const [pull, setPull] = useState({ x: 0, y: 0, over: false });

  function toward(e: React.DragEvent) {
    e.preventDefault();
    const r = box.current?.getBoundingClientRect();
    if (!r) return;
    setPull({
      x: (e.clientX - (r.left + r.width / 2)) * 0.14,
      y: (e.clientY - (r.top + r.height / 2)) * 0.14,
      over: true,
    });
  }

  function take(list: FileList | File[]) {
    const next = Array.from(list);
    if (next.length) onFiles(next);
    setPull({ x: 0, y: 0, over: false });
  }

  return (
    <div>
      <motion.button
        ref={box}
        type="button"
        onClick={() => input.current?.click()}
        onDragOver={toward}
        onDragLeave={() => setPull({ x: 0, y: 0, over: false })}
        onDrop={(e) => {
          e.preventDefault();
          take(e.dataTransfer.files);
        }}
        animate={
          reduce
            ? undefined
            : { x: pull.x, y: pull.y, scale: pull.over ? 1.03 : 1 }
        }
        transition={{ type: "spring", stiffness: 420, damping: 28, mass: 0.6 }}
        className={cn(
          "flex w-full flex-col items-center justify-center rounded-[22px] border border-dashed px-4 py-7 text-center",
          pull.over ? "border-brand bg-brand-soft" : "border-line bg-[#f6f8fd]",
        )}
      >
        <p className="text-sm font-semibold">{label}</p>
        <p className="mt-1 text-xs text-muted">{hint ?? "Drop files here, or click to browse"}</p>
        {files.length > 0 && (
          <p className="mt-2 text-xs font-semibold text-brand">
            {files.length} file{files.length === 1 ? "" : "s"} attached
          </p>
        )}
      </motion.button>
      <input
        ref={input}
        type="file"
        multiple
        accept={accept}
        className="sr-only"
        onChange={(e) => take(e.target.files ?? [])}
      />
    </div>
  );
}

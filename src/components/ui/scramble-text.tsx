"use client";

import { useEffect, useState } from "react";

const GLYPHS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function ScrambleText({ value, className }: { value: string; className?: string }) {
  const [shown, setShown] = useState(value);

  useEffect(() => {
    let i = 0;
    const frames = 9;
    const id = window.setInterval(() => {
      i += 1;
      if (i >= frames) {
        setShown(value);
        window.clearInterval(id);
        return;
      }
      setShown(
        value
          .split("")
          .map((ch, n) => (/[A-Za-z0-9]/.test(ch) ? GLYPHS[(n + i * 5) % GLYPHS.length] : ch))
          .join(""),
      );
    }, 28);
    return () => window.clearInterval(id);
  }, [value]);

  return <span className={className}>{shown}</span>;
}

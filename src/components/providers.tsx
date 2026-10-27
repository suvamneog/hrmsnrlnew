"use client";

import { useHrms } from "@/lib/store";
import { Toaster } from "sonner";
import { useEffect } from "react";

export function Providers({ children }: { children: React.ReactNode }) {
  const setHydrated = useHrms((s) => s.setHydrated);

  useEffect(() => {
    const unsub = useHrms.persist.onFinishHydration(() => setHydrated());
    if (useHrms.persist.hasHydrated()) setHydrated();
    return unsub;
  }, [setHydrated]);

  return (
    <>
      {children}
      <Toaster position="top-right" richColors />
    </>
  );
}

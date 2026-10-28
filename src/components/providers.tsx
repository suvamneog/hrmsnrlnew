"use client";

import { AutoTranslate } from "@/components/i18n/auto-translate";
import { OfflineBar } from "@/components/offline/offline-bar";
import { useHrms } from "@/lib/store";
import { Toaster } from "sonner";
import { useEffect } from "react";

export function Providers({ children }: { children: React.ReactNode }) {
  const setHydrated = useHrms((s) => s.setHydrated);
  const locale = useHrms((s) => s.locale);

  useEffect(() => {
    const unsub = useHrms.persist.onFinishHydration(() => setHydrated());
    if (useHrms.persist.hasHydrated()) setHydrated();
    return unsub;
  }, [setHydrated]);

  return (
    <>
      {children}
      <AutoTranslate locale={locale} />
      <OfflineBar />
      <Toaster position="top-right" richColors />
    </>
  );
}

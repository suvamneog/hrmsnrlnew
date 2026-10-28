"use client";

import type { Locale } from "@/lib/i18n";
import { useHrms } from "@/lib/store";
import { useSyncExternalStore } from "react";

const noop = () => () => {};

/* The saved language lives in the browser, so the server render and the first client
   render use English; the chosen language takes over right after hydration. */
export function useLocale(): Locale {
  const locale = useHrms((s) => s.locale);
  const client = useSyncExternalStore(noop, () => true, () => false);
  return client ? locale : "en";
}

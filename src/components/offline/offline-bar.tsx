"use client";

import { easeOut } from "@/lib/motion";
import { useDesk } from "@/lib/desk";
import { useHrms } from "@/lib/store";
import { CloudSlash } from "@phosphor-icons/react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

/* Registers the offline worker and tells people when they have no signal.
   Everything they do offline is kept on the device; the count says how much is waiting. */
export function OfflineBar() {
  const [offline, setOffline] = useState(false);
  const [pending, setPending] = useState(0);
  const offlineRef = useRef(false);

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js", { scope: "/", updateViaCache: "none" }).catch(() => {});
    }
    const sync = () => {
      const now = !navigator.onLine;
      if (offlineRef.current && !now) {
        toast.success("Back online.");
        setPending(0);
      }
      offlineRef.current = now;
      setOffline(now);
    };
    sync();
    window.addEventListener("online", sync);
    window.addEventListener("offline", sync);
    // Count changes made while offline, from either store.
    const bump = () => offlineRef.current && setPending((n) => n + 1);
    const a = useHrms.subscribe(bump);
    const b = useDesk.subscribe(bump);
    return () => {
      window.removeEventListener("online", sync);
      window.removeEventListener("offline", sync);
      a();
      b();
    };
  }, []);

  return (
    <AnimatePresence>
      {offline && (
        <motion.div
          role="status"
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 40, opacity: 0 }}
          transition={{ duration: 0.35, ease: easeOut }}
          className="fixed inset-x-3 bottom-20 z-50 mx-auto flex max-w-xl items-center gap-3 rounded-2xl bg-ink px-4 py-3 text-[13px] text-white shadow-[0_16px_40px_rgba(20,30,90,0.25)] md:bottom-5"
        >
          <CloudSlash size={18} className="shrink-0" />
          <span className="min-w-0 flex-1">You are offline. Your changes are kept on this device.</span>
          {pending > 0 && <span className="shrink-0 rounded-full bg-white/15 px-2.5 py-0.5 tabular-nums">{pending}</span>}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

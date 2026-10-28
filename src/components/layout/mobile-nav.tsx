"use client";

import { NavIcon } from "@/components/icons";
import { LanguageSwitch } from "@/components/i18n/language-switch";
import { cn } from "@/lib/cn";
import { landingFor } from "@/lib/access";
import { easeOut, spring } from "@/lib/motion";
import { visibleNav } from "@/lib/nav";
import { useHrms } from "@/lib/store";
import { List, X } from "@phosphor-icons/react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";

/* Phone menu: a button at the left of the top bar opens the full navigation as a drawer.
   The desktop sidebar stays as it is; this only exists below the md breakpoint. */
export function MobileNav() {
  const role = useHrms((s) => s.actingRole);
  const items = visibleNav(role);
  const path = usePathname();
  const reduce = useReducedMotion();
  const [open, setOpen] = useState(false);
  const [seenPath, setSeenPath] = useState(path);
  const client = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  // Close after navigating.
  if (seenPath !== path) {
    setSeenPath(path);
    setOpen(false);
  }

  useEffect(() => {
    if (!open) return;
    const key = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", key);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", key);
    };
  }, [open]);

  return (
    <>
      <motion.button
        type="button"
        whileTap={reduce ? undefined : { scale: 0.92 }}
        transition={spring}
        onClick={() => setOpen(true)}
        aria-label="Open menu"
        aria-expanded={open}
        className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-white text-ink md:hidden"
      >
        <List size={20} weight="bold" />
      </motion.button>

      {client &&
        createPortal(
          <AnimatePresence>
            {open && (
              <div
                className="fixed inset-0 z-[60] md:hidden"
                role="dialog"
                aria-modal="true"
                aria-label="Menu"
              >
                <motion.button
                  type="button"
                  aria-label="Close menu"
                  className="absolute inset-0 bg-[#141a3a]/40 backdrop-blur-[2px]"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.25, ease: easeOut }}
                  onClick={() => setOpen(false)}
                />
                <motion.aside
                  className="absolute inset-y-0 left-0 flex w-[min(84vw,300px)] flex-col bg-[#3d5afe] text-white shadow-[16px_0_48px_rgba(20,30,90,0.28)]"
                  initial={reduce ? { opacity: 0 } : { x: "-100%" }}
                  animate={reduce ? { opacity: 1 } : { x: 0 }}
                  exit={reduce ? { opacity: 0 } : { x: "-100%" }}
                  transition={
                    reduce
                      ? { duration: 0.15 }
                      : { type: "spring", stiffness: 420, damping: 40 }
                  }
                  drag={reduce ? false : "x"}
                  dragConstraints={{ left: 0, right: 0 }}
                  dragElastic={{ left: 0.4, right: 0 }}
                  onDragEnd={(_, info) =>
                    (info.offset.x < -80 || info.velocity.x < -400) &&
                    setOpen(false)
                  }
                >
                  <div className="flex items-center justify-between px-4 pt-[max(16px,env(safe-area-inset-top))] pb-4">
                    <Link
                      href={landingFor(role)}
                      className="flex items-center gap-3"
                    >
                      <span className="grid h-11 w-11 place-items-center rounded-2xl bg-white/15 text-lg font-bold">
                        N
                      </span>
                      <span className="text-base font-semibold">
                        NRL People
                      </span>
                    </Link>
                    <button
                      type="button"
                      onClick={() => setOpen(false)}
                      aria-label="Close menu"
                      className="grid h-10 w-10 place-items-center rounded-full bg-white/15"
                    >
                      <X size={18} weight="bold" />
                    </button>
                  </div>

                  <nav className="flex-1 overflow-y-auto overscroll-contain px-3 pb-4">
                    {items.map((item, i) => {
                      const active =
                        path === item.href || path.startsWith(`${item.href}/`);
                      return (
                        <motion.div
                          key={item.href}
                          initial={reduce ? false : { opacity: 0, x: -12 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{
                            duration: 0.35,
                            ease: easeOut,
                            delay: reduce ? 0 : 0.04 + i * 0.018,
                          }}
                        >
                          <Link
                            href={item.href}
                            onClick={() => setOpen(false)}
                            className={cn(
                              "relative flex h-12 items-center gap-3 rounded-2xl px-3 text-[15px] font-semibold transition-colors",
                              active
                                ? "text-brand"
                                : "text-white/90 active:bg-white/10",
                            )}
                          >
                            {active && (
                              <motion.span
                                layoutId="mobile-nav-pill"
                                transition={spring}
                                className="absolute inset-0 rounded-2xl bg-white"
                              />
                            )}
                            <span className="relative grid h-9 w-9 shrink-0 place-items-center">
                              <NavIcon name={item.icon} />
                            </span>
                            <span className="relative truncate">
                              {item.label}
                            </span>
                          </Link>
                        </motion.div>
                      );
                    })}
                  </nav>

                  <div className="border-t border-white/15 px-4 pt-4 pb-[max(16px,env(safe-area-inset-bottom))]">
                    <LanguageSwitch onDark />
                  </div>
                </motion.aside>
              </div>
            )}
          </AnimatePresence>,
          document.body,
        )}
    </>
  );
}

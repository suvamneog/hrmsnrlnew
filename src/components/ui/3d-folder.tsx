"use client";

// Adapted from the 21st.dev "3D Folder" component: same folder build and fan-out,
// but items are files with a rendered preview, it opens on tap for phones, and the
// viewer grows out of the tapped card with a shared-layout spring.

import { cn } from "@/lib/utils";
import { easeOut, spring } from "@/lib/motion";
import { ChevronLeft, ChevronRight, Download, X } from "lucide-react";
import { AnimatePresence, LayoutGroup, motion, useReducedMotion } from "motion/react";
import { useCallback, useEffect, useId, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

export interface FolderItem {
  id: string;
  title: string;
  subtitle?: string;
  image?: string;
  // Rendered inside the fanned card and the viewer when there is no image.
  preview?: ReactNode;
  onOpen?: () => void;
  openLabel?: string;
}

interface AnimatedFolderProps {
  title: string;
  items: FolderItem[];
  countLabel?: string;
  className?: string;
}

// Exponential ease-out: settles smoothly with no overshoot.
const folderSpring = "cubic-bezier(0.16, 1, 0.3, 1)";

export function AnimatedFolder({ title, items, countLabel = "files", className }: AnimatedFolderProps) {
  const [hovered, setHovered] = useState(false);
  const [selected, setSelected] = useState<number | null>(null);
  const reduce = useReducedMotion();
  const group = useId();
  const open = hovered || selected !== null;
  const shown = items.slice(0, 3);

  return (
    <LayoutGroup id={group}>
      <div
        role="button"
        tabIndex={0}
        aria-label={`${title}, ${items.length} ${countLabel}`}
        className={cn(
          "group relative flex cursor-pointer flex-col items-center justify-center rounded-xl bg-white px-8 pb-12 pt-24",
          "ring-1 ring-[#e7eaf3] shadow-[0_6px_20px_rgba(27,33,64,0.06)] transition-[box-shadow,transform] duration-500 ease-out",
          "hover:shadow-[0_24px_60px_rgba(45,64,180,0.14)]",
          className,
        )}
        style={{ minWidth: 260, minHeight: 360, perspective: "1000px" }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onClick={() => setHovered((v) => !v)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") setHovered((v) => !v);
        }}
      >
        <div
          className="absolute inset-0 rounded-xl transition-opacity duration-500"
          style={{ background: "radial-gradient(circle at 50% 70%, var(--brand) 0%, transparent 70%)", opacity: open ? 0.07 : 0 }}
        />

        <div className="relative mb-4 flex items-center justify-center" style={{ height: 160, width: 200 }}>
          <div
            className="absolute h-24 w-32 rounded-lg bg-[#2f49e0] shadow-md"
            style={{
              transformOrigin: "bottom center",
              transform: open ? "rotateX(-15deg)" : "rotateX(0deg)",
              transition: `transform 500ms ${folderSpring}`,
              zIndex: 10,
            }}
          />
          <div
            className="absolute h-4 w-12 rounded-t-md bg-[#2a3fc4]"
            style={{
              top: "calc(50% - 48px - 12px)",
              left: "calc(50% - 64px + 16px)",
              transformOrigin: "bottom center",
              transform: open ? "rotateX(-25deg) translateY(-2px)" : "rotateX(0deg)",
              transition: `transform 500ms ${folderSpring}`,
              zIndex: 10,
            }}
          />

          <div className="absolute" style={{ top: "50%", left: "50%", transform: "translate(-50%, -50%)", zIndex: 20 }}>
            {shown.map((item, index) => (
              <FileCard
                key={item.id}
                item={item}
                index={index}
                visible={open}
                hidden={selected === index}
                reduce={!!reduce}
                onClick={() => setSelected(index)}
              />
            ))}
          </div>

          <div
            className="absolute h-24 w-32 rounded-lg bg-[#5b74ff] shadow-lg"
            style={{
              top: "calc(50% - 48px + 4px)",
              transformOrigin: "bottom center",
              transform: open ? "rotateX(25deg) translateY(8px)" : "rotateX(0deg)",
              transition: `transform 500ms ${folderSpring}`,
              zIndex: 30,
            }}
          />
          <div
            className="pointer-events-none absolute h-24 w-32 overflow-hidden rounded-lg"
            style={{
              top: "calc(50% - 48px + 4px)",
              background: "linear-gradient(135deg, rgba(255,255,255,0.32) 0%, transparent 50%)",
              transformOrigin: "bottom center",
              transform: open ? "rotateX(25deg) translateY(8px)" : "rotateX(0deg)",
              transition: `transform 500ms ${folderSpring}`,
              zIndex: 31,
            }}
          />
        </div>

        <h3
          className="mt-4 text-lg font-semibold tracking-tight text-ink transition-transform duration-300"
          style={{ transform: open ? "translateY(4px)" : "translateY(0)" }}
        >
          {title}
        </h3>
        <p className="text-sm text-muted transition-opacity duration-300" style={{ opacity: open ? 0.7 : 1 }}>
          {items.length} {countLabel}
        </p>
        <span
          className="absolute bottom-4 left-1/2 -translate-x-1/2 text-xs text-muted transition-all duration-300"
          style={{ opacity: open ? 0 : 0.6, transform: `translate(-50%, ${open ? 10 : 0}px)` }}
        >
          Tap to open
        </span>
      </div>

      <Viewer items={shown} index={selected} onIndex={setSelected} onClose={() => setSelected(null)} />
    </LayoutGroup>
  );
}

function FileCard({
  item,
  index,
  visible,
  hidden,
  reduce,
  onClick,
}: {
  item: FolderItem;
  index: number;
  visible: boolean;
  hidden: boolean;
  reduce: boolean;
  onClick: () => void;
}) {
  const rotations = [-12, 0, 12];
  const offsets = [-55, 0, 55];
  return (
    <div
      className="absolute"
      style={{
        left: -40,
        top: -56,
        zIndex: 10 - index,
        transform: visible
          ? `translateY(-90px) translateX(${offsets[index]}px) rotate(${rotations[index]}deg) scale(1)`
          : "translateY(0) translateX(0) rotate(0deg) scale(0.5)",
        opacity: visible ? 1 : 0,
        transition: reduce ? "none" : `transform 600ms ${folderSpring} ${index * 80}ms, opacity 300ms ease ${index * 80}ms`,
      }}
    >
      {!hidden && (
        <motion.button
          type="button"
          layoutId={`file-${item.id}`}
          transition={spring}
          onClick={(e) => {
            e.stopPropagation();
            onClick();
          }}
          className="relative block h-28 w-20 overflow-hidden rounded-lg bg-white text-left shadow-xl ring-1 ring-[#e7eaf3] transition-shadow hover:ring-2 hover:ring-brand/50"
          aria-label={`Open ${item.title}`}
        >
          {item.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={item.image} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="pointer-events-none h-full w-full origin-top-left scale-[0.32]" style={{ width: "312%", height: "312%" }}>
              {item.preview}
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[#1b2140]/65 via-transparent to-transparent" />
          <p className="absolute inset-x-1.5 bottom-1.5 truncate text-[10px] font-medium text-white">{item.title}</p>
        </motion.button>
      )}
    </div>
  );
}

function Viewer({
  items,
  index,
  onIndex,
  onClose,
}: {
  items: FolderItem[];
  index: number | null;
  onIndex: (i: number) => void;
  onClose: () => void;
}) {
  const [dir, setDir] = useState(1);
  const item = index === null ? null : items[index];
  const go = useCallback(
    (to: number) => {
      if (index === null || to < 0 || to >= items.length) return;
      setDir(to > index ? 1 : -1);
      onIndex(to);
    },
    [index, items.length, onIndex],
  );

  useEffect(() => {
    if (index === null) return;
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") go(index + 1);
      if (e.key === "ArrowLeft") go(index - 1);
    };
    window.addEventListener("keydown", key);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", key);
      document.body.style.overflow = "";
    };
  }, [index, go, onClose]);

  if (typeof document === "undefined") return null;
  return createPortal(
    <AnimatePresence>
      {item && index !== null && (
        <motion.div
          key="viewer"
          className="fixed inset-0 z-[80] flex items-center justify-center p-4 md:p-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.25 } }}
          onClick={onClose}
        >
          <div className="absolute inset-0 bg-[#f3f5fb]/75 backdrop-blur-xl" />

          <motion.div
            layoutId={`file-${items[index].id}`}
            transition={spring}
            onClick={(e) => e.stopPropagation()}
            className="relative z-10 w-full max-w-2xl overflow-hidden rounded-xl bg-white shadow-[0_40px_100px_rgba(27,33,64,0.22)] ring-1 ring-[#e7eaf3]"
          >
            <div className="relative h-[min(62vh,520px)] overflow-hidden bg-[#f6f8fd]">
              <AnimatePresence initial={false} custom={dir} mode="popLayout">
                <motion.div
                  key={item.id}
                  custom={dir}
                  initial={{ x: `${dir * 100}%`, opacity: 0.6 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: `${-dir * 100}%`, opacity: 0.6 }}
                  transition={{ duration: 0.45, ease: [0.32, 0.72, 0, 1] }}
                  className="absolute inset-0 overflow-auto"
                >
                  {item.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={item.image} alt={item.title} className="h-full w-full object-contain" />
                  ) : (
                    item.preview
                  )}
                </motion.div>
              </AnimatePresence>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, ease: easeOut, delay: 0.12 }}
              className="flex items-center justify-between gap-4 border-t border-line px-6 py-4"
            >
              <div className="min-w-0">
                <p className="truncate text-[17px] font-semibold tracking-tight">{item.title}</p>
                <div className="mt-1 flex items-center gap-3">
                  {item.subtitle && <span className="text-[13px] text-muted">{item.subtitle}</span>}
                  <span className="flex gap-1.5">
                    {items.map((x, i) => (
                      <button
                        key={x.id}
                        type="button"
                        aria-label={`Show ${x.title}`}
                        onClick={() => go(i)}
                        className={cn("h-2 w-2 rounded-full transition-all duration-300", i === index ? "scale-110 bg-ink" : "bg-[#c3c9d6] hover:bg-muted")}
                      />
                    ))}
                  </span>
                </div>
              </div>
              {item.onOpen && (
                <button
                  type="button"
                  onClick={item.onOpen}
                  className="inline-flex shrink-0 items-center gap-2 rounded-full bg-brand px-4 py-2 text-sm font-semibold text-white shadow-[0_6px_16px_rgba(61,90,254,0.26)] transition hover:bg-brand-deep active:scale-[0.97]"
                >
                  <Download className="h-4 w-4" />
                  {item.openLabel ?? "Download"}
                </button>
              )}
            </motion.div>
          </motion.div>

          <ViewerButton side="left" hidden={index === 0} onClick={() => go(index - 1)} />
          <ViewerButton side="right" hidden={index === items.length - 1} onClick={() => go(index + 1)} />
          <motion.button
            type="button"
            aria-label="Close"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.3, ease: easeOut }}
            onClick={onClose}
            className="absolute right-5 top-5 z-20 grid h-10 w-10 place-items-center rounded-full bg-white/80 text-muted ring-1 ring-[#e7eaf3] backdrop-blur-md transition hover:scale-105 hover:text-ink active:scale-95"
          >
            <X className="h-4 w-4" strokeWidth={2.5} />
          </motion.button>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}

function ViewerButton({ side, hidden, onClick }: { side: "left" | "right"; hidden: boolean; onClick: () => void }) {
  if (hidden) return null;
  const Icon = side === "left" ? ChevronLeft : ChevronRight;
  return (
    <motion.button
      type="button"
      aria-label={side === "left" ? "Previous" : "Next"}
      initial={{ opacity: 0, x: side === "left" ? -16 : 16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.18, duration: 0.3, ease: easeOut }}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className={cn(
        "absolute z-20 grid h-12 w-12 place-items-center rounded-full bg-white/80 text-muted ring-1 ring-[#e7eaf3] backdrop-blur-md transition hover:scale-110 hover:text-ink active:scale-95",
        side === "left" ? "left-4 md:left-8" : "right-4 md:right-8",
      )}
    >
      <Icon className="h-5 w-5" strokeWidth={2.5} />
    </motion.button>
  );
}

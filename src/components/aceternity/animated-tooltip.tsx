"use client";

import React, { useState, useRef } from "react";
import {
  motion,
  useTransform,
  AnimatePresence,
  useMotionValue,
  useSpring,
} from "motion/react";

export const AnimatedTooltip = ({
  items,
  size = 56,
}: {
  items: {
    id: number;
    name: string;
    designation?: string;
    image: string;
  }[];
  size?: number;
}) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const springConfig = { stiffness: 160, damping: 22 };
  const x = useMotionValue(0);
  const animationFrameRef = useRef<number | null>(null);

  const rotate = useSpring(
    useTransform(x, [-100, 100], [-45, 45]),
    springConfig,
  );
  const translateX = useSpring(
    useTransform(x, [-100, 100], [-50, 50]),
    springConfig,
  );

  const handleMouseMove = (event: React.MouseEvent<HTMLImageElement>) => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    // Read the event before the frame: React clears currentTarget once the handler returns.
    const halfWidth = event.currentTarget.offsetWidth / 2;
    const offsetX = event.nativeEvent.offsetX;
    animationFrameRef.current = requestAnimationFrame(() => {
      x.set(offsetX - halfWidth);
    });
  };

  return (
    <>
      {items.map((item, idx) => (
        <div
          className="group relative -mr-2"
          key={item.name}
          onMouseEnter={() => setHoveredIndex(item.id)}
          onMouseLeave={() => setHoveredIndex(null)}
        >
          <AnimatePresence>
            {hoveredIndex === item.id && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.85 }}
                animate={{
                  opacity: 1,
                  y: 0,
                  scale: 1,
                  transition: {
                    type: "spring",
                    stiffness: 420,
                    damping: 26,
                  },
                }}
                exit={{ opacity: 0, y: 10, scale: 0.85, transition: { duration: 0.15 } }}
                style={{
                  translateX: translateX,
                  rotate: rotate,
                  whiteSpace: "nowrap",
                }}
                className="absolute bottom-[calc(100%+8px)] left-1/2 z-50 flex -translate-x-1/2 flex-col items-center justify-center rounded-xl bg-ink px-3 py-1.5 text-xs shadow-[0_8px_24px_rgba(20,26,58,0.12)]"
              >
                <div className="relative z-30 text-[13px] font-semibold text-white">
                  {item.name}
                </div>
                {item.designation && <div className="text-[12px] text-white/70">{item.designation}</div>}
              </motion.div>
            )}
          </AnimatePresence>
          <img
            onMouseMove={handleMouseMove}
            height={size}
            width={size}
            style={{ width: size, height: size }}
            src={item.image}
            alt={item.name}
            className="relative !m-0 rounded-full border-2 border-white bg-brand-soft object-cover object-top !p-0 transition duration-300 group-hover:z-30 group-hover:scale-110"
          />
        </div>
      ))}
    </>
  );
};

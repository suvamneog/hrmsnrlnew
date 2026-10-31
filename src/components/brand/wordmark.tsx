import { cn } from "@/lib/cn";
import Image from "next/image";

/* NRL's official emblem (from nrl.co.in), cropped to a square tile; the same image makes the app icon. */
export function Mark({ size = 28, className }: { size?: number; className?: string }) {
  return (
    <span className={cn("relative block shrink-0 overflow-hidden rounded-lg bg-[#1d2a5c]", className)} style={{ width: size, height: size }}>
      <Image src="/brand/nrl-og-logo.png" alt="" fill sizes={`${size}px`} className="object-cover" />
    </span>
  );
}

/* The full official logo with the company name, for white surfaces such as the login card. */
export function NrlLogo({ height = 40, className }: { height?: number; className?: string }) {
  return (
    <Image
      src="/brand/nrl-logo.jpg"
      alt="Numaligarh Refinery Limited, a Government of India enterprise"
      width={Math.round((height * 257) / 74)}
      height={height}
      className={className}
      priority
    />
  );
}

export function Wordmark({ className, sub }: { className?: string; sub?: string }) {
  return (
    <span className={cn("flex items-center gap-2.5", className)}>
      <Mark size={26} />
      <span className="leading-tight">
        <span className="block text-[15px] tracking-tight">
          NRL <b className="font-semibold">People</b>
        </span>
        {sub && <span className="block text-[12px] opacity-70">{sub}</span>}
      </span>
    </span>
  );
}

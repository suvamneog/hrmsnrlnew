import { format, parseISO } from "date-fns";

export function inr(n: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Math.round(n));
}

export function inrExact(n: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);
}

export function pct(n: number, digits = 1) {
  return `${n.toFixed(digits)}%`;
}

export function maskAadhaar(value: string) {
  const digits = value.replace(/\D/g, "");
  if (digits.length < 4) return "XXXX-XXXX-XXXX";
  return `XXXX-XXXX-${digits.slice(-4)}`;
}

export function maskBank(account: string) {
  if (account.length < 4) return "XXXX";
  return `XXXXXX${account.slice(-4)}`;
}

export function maskPan(pan: string) {
  if (pan.length < 4) return "XXXXXXXXXX";
  return `${pan.slice(0, 2)}XXXXXX${pan.slice(-2)}`;
}

export function formatDay(iso: string) {
  return format(parseISO(iso), "d MMM yyyy");
}

export function formatStamp(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return format(d, "d MMM yyyy, h:mm a");
}

export function formatClock(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso.slice(11, 16);
  return format(d, "h:mm a");
}

export function formatWeekday(iso: string) {
  return format(parseISO(iso), "EEEE, d MMM");
}

export function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();
}


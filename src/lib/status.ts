import type { AttendanceStatus, Cadre, EmploymentStatus, RequestStatus } from "./types";

export function requestTone(s: RequestStatus) {
  if (s === "approved") return "ok" as const;
  if (s === "rejected") return "danger" as const;
  if (s === "pending") return "warn" as const;
  return "muted" as const;
}

export function cadreTone(c: Cadre) {
  if (c === "executive") return "lilac" as const;
  if (c === "workman") return "peach" as const;
  if (c === "trainee") return "ok" as const;
  if (c === "contract") return "warn" as const;
  return "muted" as const;
}

export function attTone(s: AttendanceStatus) {
  if (s === "present") return "ok" as const;
  if (s === "leave" || s === "weekly_off" || s === "holiday") return "muted" as const;
  if (s === "missing_punch" || s === "absent") return "danger" as const;
  return "warn" as const;
}

export function empStatus(s: EmploymentStatus) {
  if (s === "active") return "ok" as const;
  if (s === "probation") return "lilac" as const;
  if (s === "notice") return "warn" as const;
  return "muted" as const;
}

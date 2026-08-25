import { Urgency } from "@/types/models";

const DAY_MS = 24 * 60 * 60 * 1000;
const DUE_SOON_DAYS = 30;
const DUE_SOON_KM = 500;

/**
 * Date-only urgency: registration / insurance expiry.
 */
export function dateUrgency(expiryIso: string, now: Date = new Date()): Urgency {
  const expiry = new Date(expiryIso);
  const diffDays = (expiry.getTime() - now.getTime()) / DAY_MS;
  if (diffDays < 0) return "overdue";
  if (diffDays <= DUE_SOON_DAYS) return "due_soon";
  return "ok";
}

/**
 * PMS is due by date OR mileage, whichever comes first — the worse
 * (more urgent) of the two thresholds wins.
 */
export function pmsUrgency(
  dueDateIso: string,
  dueKm: number | undefined,
  currentOdometerKm: number,
  now: Date = new Date()
): Urgency {
  const byDate = dateUrgency(dueDateIso, now);
  if (dueKm == null) return byDate;

  const kmRemaining = dueKm - currentOdometerKm;
  let byKm: Urgency;
  if (kmRemaining < 0) byKm = "overdue";
  else if (kmRemaining <= DUE_SOON_KM) byKm = "due_soon";
  else byKm = "ok";

  return worseOf(byDate, byKm);
}

const RANK: Record<Urgency, number> = { ok: 0, due_soon: 1, overdue: 2 };

export function worseOf(a: Urgency, b: Urgency): Urgency {
  return RANK[a] >= RANK[b] ? a : b;
}

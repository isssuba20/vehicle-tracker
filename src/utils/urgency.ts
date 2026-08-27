import { Urgency } from "@/types/models";
import { DEFAULT_DUE_SOON_DAYS, DEFAULT_DUE_SOON_KM } from "@/state/useReminderSettingsStore";

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Date-only urgency: registration / insurance expiry. `dueSoonDays`
 * defaults to the app-wide default but callers with access to
 * useReminderSettingsStore should pass the user's configured value.
 */
export function dateUrgency(
  expiryIso: string,
  dueSoonDays: number = DEFAULT_DUE_SOON_DAYS,
  now: Date = new Date()
): Urgency {
  const expiry = new Date(expiryIso);
  const diffDays = (expiry.getTime() - now.getTime()) / DAY_MS;
  if (diffDays < 0) return "overdue";
  if (diffDays <= dueSoonDays) return "due_soon";
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
  dueSoonDays: number = DEFAULT_DUE_SOON_DAYS,
  dueSoonKm: number = DEFAULT_DUE_SOON_KM,
  now: Date = new Date()
): Urgency {
  const byDate = dateUrgency(dueDateIso, dueSoonDays, now);
  if (dueKm == null) return byDate;

  const kmRemaining = dueKm - currentOdometerKm;
  let byKm: Urgency;
  if (kmRemaining < 0) byKm = "overdue";
  else if (kmRemaining <= dueSoonKm) byKm = "due_soon";
  else byKm = "ok";

  return worseOf(byDate, byKm);
}

const RANK: Record<Urgency, number> = { ok: 0, due_soon: 1, overdue: 2 };

export function worseOf(a: Urgency, b: Urgency): Urgency {
  return RANK[a] >= RANK[b] ? a : b;
}

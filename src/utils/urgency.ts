import { Urgency } from "@/types/models";
import { DEFAULT_DUE_SOON_DAYS, DEFAULT_DUE_SOON_KM } from "@/state/useReminderSettingsStore";
import { fromLocalIso } from "@/utils/date";

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Date-only urgency: registration / insurance expiry. `dueSoonDays`
 * defaults to the app-wide default but callers with access to
 * useReminderSettingsStore should pass the user's configured value.
 *
 * Compares local calendar days, not raw instants: `new Date(expiryIso)`
 * would anchor to UTC midnight, so for any positive UTC offset (the
 * Philippines is UTC+8) a renewal due "today" would read as already
 * overdue by local mid-afternoon — hours before the local day actually
 * ends. Diffing local-midnight-to-local-midnight makes the overdue
 * transition land exactly at local midnight regardless of timezone,
 * and as a whole-day integer rather than a time-of-day-dependent
 * fraction.
 */
export function dateUrgency(
  expiryIso: string,
  dueSoonDays: number = DEFAULT_DUE_SOON_DAYS,
  now: Date = new Date()
): Urgency {
  const expiry = fromLocalIso(expiryIso);
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const diffDays = Math.round((expiry.getTime() - today.getTime()) / DAY_MS);
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

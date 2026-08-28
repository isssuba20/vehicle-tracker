/**
 * This app stores dates as plain "YYYY-MM-DD" calendar days (registration
 * expiry, a fill-up's date, ...) — never as UTC instants. `Date.toISOString()`
 * always converts through UTC, so `new Date().toISOString().slice(0, 10)`
 * silently shifts the calendar date by a day whenever the device's local
 * time and UTC fall on different dates — which, for any positive UTC
 * offset (the Philippines is UTC+8, this app's primary market), is not a
 * rare midnight edge case: it's every date, every time. Same problem in
 * reverse for `new Date("2026-03-15")`, which the spec parses as UTC
 * midnight, not local midnight. Use these instead of touching
 * toISOString()/`new Date(isoString)` directly for any date meant to
 * represent "today" or a picked calendar day.
 */

/** A Date's own local year/month/day, as "YYYY-MM-DD" — never converts through UTC. */
export function toLocalIso(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Today, in the device's local timezone. */
export function todayIso(): string {
  return toLocalIso(new Date());
}

/** Parses a "YYYY-MM-DD" string as local midnight on that day (not UTC midnight). */
export function fromLocalIso(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}

import { FuelLogEntry } from "@/types/models";

/**
 * No consumer vehicle plausibly exceeds this. A value above it almost
 * always means the odometer gap and the liters logged don't actually
 * belong to the same fill-up interval (a skipped fill-up, a typo'd
 * odometer reading, or a typo'd liters value) — not a genuinely
 * efficient vehicle.
 */
export const MAX_PLAUSIBLE_KM_PER_LITER = 100;

export interface FuelEntryWithEfficiency extends FuelLogEntry {
  kmPerLiter: number | null;
  /** True when kmPerLiter was computed but exceeds MAX_PLAUSIBLE_KM_PER_LITER. */
  implausible: boolean;
}

/**
 * km/L is derived, never stored: for each entry, the gap to the previous
 * (chronologically earlier) fuel entry's odometer reading, divided by the
 * liters on this entry. The earliest entry has no prior reading, so its
 * km/L is null.
 */
export function withComputedEfficiency(
  entriesDescByDate: FuelLogEntry[]
): FuelEntryWithEfficiency[] {
  const ascending = [...entriesDescByDate].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  const efficiencyById = new Map<string, number | null>();
  for (let i = 0; i < ascending.length; i++) {
    const entry = ascending[i];
    const prev = ascending[i - 1];
    if (!prev || entry.liters <= 0) {
      efficiencyById.set(entry.id, null);
      continue;
    }
    const kmGap = entry.odometerKm - prev.odometerKm;
    efficiencyById.set(entry.id, kmGap > 0 ? kmGap / entry.liters : null);
  }

  return entriesDescByDate.map((e) => {
    const kmPerLiter = efficiencyById.get(e.id) ?? null;
    return {
      ...e,
      kmPerLiter,
      implausible: kmPerLiter != null && kmPerLiter > MAX_PLAUSIBLE_KM_PER_LITER,
    };
  });
}

export interface LatestEfficiency {
  kmPerLiter: number | null;
  implausible: boolean;
}

export function latestKmPerLiter(entriesDescByDate: FuelLogEntry[]): LatestEfficiency {
  const withEff = withComputedEfficiency(entriesDescByDate);
  if (withEff.length === 0) return { kmPerLiter: null, implausible: false };
  return { kmPerLiter: withEff[0].kmPerLiter, implausible: withEff[0].implausible };
}

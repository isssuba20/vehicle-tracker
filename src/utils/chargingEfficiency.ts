import { ChargingLogEntry } from "@/types/models";

/**
 * No consumer EV plausibly exceeds this. Mirrors the same reasoning as
 * MAX_PLAUSIBLE_KM_PER_LITER for fuel: a value above it almost always
 * means the odometer gap and the kWh logged don't actually belong to
 * the same charge interval, not a genuinely efficient vehicle.
 */
export const MAX_PLAUSIBLE_KM_PER_KWH = 15;

export interface ChargingEntryWithEfficiency extends ChargingLogEntry {
  kmPerKwh: number | null;
  /** True when kmPerKwh was computed but exceeds MAX_PLAUSIBLE_KM_PER_KWH. */
  implausible: boolean;
}

/**
 * km/kWh is derived, never stored: for each entry, the gap to the
 * previous (chronologically earlier) charging entry's odometer reading,
 * divided by the kWh added on this entry. The earliest entry has no
 * prior reading, so its km/kWh is null.
 */
export function withComputedChargingEfficiency(
  entriesDescByDate: ChargingLogEntry[]
): ChargingEntryWithEfficiency[] {
  const ascending = [...entriesDescByDate].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  const efficiencyById = new Map<string, number | null>();
  for (let i = 0; i < ascending.length; i++) {
    const entry = ascending[i];
    const prev = ascending[i - 1];
    if (!prev || entry.kwh <= 0) {
      efficiencyById.set(entry.id, null);
      continue;
    }
    const kmGap = entry.odometerKm - prev.odometerKm;
    efficiencyById.set(entry.id, kmGap > 0 ? kmGap / entry.kwh : null);
  }

  return entriesDescByDate.map((e) => {
    const kmPerKwh = efficiencyById.get(e.id) ?? null;
    return {
      ...e,
      kmPerKwh,
      implausible: kmPerKwh != null && kmPerKwh > MAX_PLAUSIBLE_KM_PER_KWH,
    };
  });
}

export interface LatestChargingEfficiency {
  kmPerKwh: number | null;
  implausible: boolean;
}

export function latestKmPerKwh(entriesDescByDate: ChargingLogEntry[]): LatestChargingEfficiency {
  const withEff = withComputedChargingEfficiency(entriesDescByDate);
  if (withEff.length === 0) return { kmPerKwh: null, implausible: false };
  return { kmPerKwh: withEff[0].kmPerKwh, implausible: withEff[0].implausible };
}

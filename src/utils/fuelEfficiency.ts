import { FuelLogEntry } from "@/types/models";

export interface FuelEntryWithEfficiency extends FuelLogEntry {
  kmPerLiter: number | null;
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

  return entriesDescByDate.map((e) => ({
    ...e,
    kmPerLiter: efficiencyById.get(e.id) ?? null,
  }));
}

export function latestKmPerLiter(entriesDescByDate: FuelLogEntry[]): number | null {
  const withEff = withComputedEfficiency(entriesDescByDate);
  return withEff.length > 0 ? withEff[0].kmPerLiter : null;
}

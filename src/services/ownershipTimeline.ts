import { Vehicle, ServiceLogEntry, FuelLogEntry, ChargingLogEntry } from "@/types/models";

export interface TimelineEvent {
  id: string;
  date: string;
  title: string;
  cost?: number;
}

export interface TimelineYearGroup {
  year: string;
  /** Highest odometer reading logged in this year, across service/fuel/charging entries — null if none. */
  milestoneKm: number | null;
  events: TimelineEvent[];
}

/**
 * Combines the purchase event with every service record into one
 * chronological, year-grouped history. Fuel/charging fill-ups aren't
 * itemized individually (too frequent to read as "history"), but their
 * odometer readings still feed each year's mileage milestone.
 */
export function getVehicleTimeline(
  vehicle: Vehicle,
  serviceEntries: ServiceLogEntry[],
  fuelEntries: FuelLogEntry[],
  chargingEntries: ChargingLogEntry[]
): TimelineYearGroup[] {
  const odometerReadings: { date: string; km: number }[] = [
    ...serviceEntries.map((e) => ({ date: e.date, km: e.odometerKm })),
    ...fuelEntries.map((e) => ({ date: e.date, km: e.odometerKm })),
    ...chargingEntries.map((e) => ({ date: e.date, km: e.odometerKm })),
  ];

  const events: TimelineEvent[] = [
    { id: "purchase", date: vehicle.purchaseDate, title: "Purchased", cost: vehicle.purchasePrice },
    ...serviceEntries.map((e) => ({ id: e.id, date: e.date, title: e.type, cost: e.cost })),
  ];

  const years = new Map<string, TimelineYearGroup>();
  for (const e of events) {
    const year = e.date.slice(0, 4);
    if (!years.has(year)) years.set(year, { year, milestoneKm: null, events: [] });
    years.get(year)!.events.push(e);
  }
  for (const r of odometerReadings) {
    const year = r.date.slice(0, 4);
    if (!years.has(year)) years.set(year, { year, milestoneKm: null, events: [] });
    const group = years.get(year)!;
    if (group.milestoneKm == null || r.km > group.milestoneKm) group.milestoneKm = r.km;
  }

  return [...years.values()]
    .sort((a, b) => a.year.localeCompare(b.year))
    .map((g) => ({ ...g, events: g.events.sort((a, b) => a.date.localeCompare(b.date)) }));
}

import { ServiceLogEntry, Vehicle } from "@/types/models";

export interface ServiceCenterSummary {
  shop: string;
  visits: number;
  totalSpent: number;
  averageVisit: number;
  lastVisitDate: string;
  vehicleNames: string[];
  serviceTypes: string[];
}

/** Groups every logged service entry, across every household vehicle, by shop name. */
export function getServiceCenterSummaries(
  vehicles: Vehicle[],
  serviceByVehicle: Record<string, ServiceLogEntry[]>
): ServiceCenterSummary[] {
  const nameOf = (id: string) => vehicles.find((v) => v.id === id)?.name ?? "Unknown vehicle";

  const byShop = new Map<
    string,
    { entries: ServiceLogEntry[]; vehicleIds: Set<string>; types: Set<string> }
  >();

  for (const vehicleId of Object.keys(serviceByVehicle)) {
    for (const e of serviceByVehicle[vehicleId] ?? []) {
      const shop = e.shop.trim() || "Unspecified shop";
      if (!byShop.has(shop)) byShop.set(shop, { entries: [], vehicleIds: new Set(), types: new Set() });
      const group = byShop.get(shop)!;
      group.entries.push(e);
      group.vehicleIds.add(vehicleId);
      group.types.add(e.type);
    }
  }

  const summaries: ServiceCenterSummary[] = [];
  for (const [shop, group] of byShop) {
    const totalSpent = group.entries.reduce((s, e) => s + e.cost, 0);
    const lastVisitDate = group.entries.reduce((latest, e) => (e.date > latest ? e.date : latest), group.entries[0].date);
    summaries.push({
      shop,
      visits: group.entries.length,
      totalSpent,
      averageVisit: totalSpent / group.entries.length,
      lastVisitDate,
      vehicleNames: [...group.vehicleIds].map(nameOf),
      serviceTypes: [...group.types],
    });
  }

  return summaries.sort((a, b) => b.totalSpent - a.totalSpent);
}

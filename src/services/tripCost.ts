import { Vehicle, FuelLogEntry, ChargingLogEntry } from "@/types/models";
import { latestKmPerLiter } from "@/utils/fuelEfficiency";
import { latestKmPerKwh } from "@/utils/chargingEfficiency";

/**
 * A one-off calculator, not a persisted feature: nothing here is stored.
 * It reads a vehicle's own most recent efficiency (km/L or km/kWh, already
 * computed from existing fuel/charging entries) and most recent per-unit
 * price (cost / liters or cost / kwh on the latest entry) to estimate what
 * a trip of a given distance would cost — then adds any one-off costs the
 * user types in (tolls, parking) for that specific trip.
 */
export interface TripCostResult {
  /** False when there isn't enough logged history to estimate a fuel/energy cost. */
  hasEnoughData: boolean;
  distanceKm: number;
  fuelOrEnergyCost: number | null;
  extraCosts: number;
  totalCost: number | null;
  costPerKm: number | null;
  unitLabel: "km/L" | "km/kWh";
  pricePerUnitLabel: string;
}

function latestUnitPrice(
  fuelEntries: FuelLogEntry[]
): number | null {
  if (fuelEntries.length === 0) return null;
  const sorted = [...fuelEntries].sort((a, b) => b.date.localeCompare(a.date));
  const latest = sorted[0];
  return latest.liters > 0 ? latest.cost / latest.liters : null;
}

function latestUnitPriceCharging(chargingEntries: ChargingLogEntry[]): number | null {
  if (chargingEntries.length === 0) return null;
  const sorted = [...chargingEntries].sort((a, b) => b.date.localeCompare(a.date));
  const latest = sorted[0];
  return latest.kwh > 0 ? latest.cost / latest.kwh : null;
}

export function computeTripCost(
  vehicle: Vehicle,
  fuelEntries: FuelLogEntry[],
  chargingEntries: ChargingLogEntry[],
  distanceKm: number,
  extraCosts: number
): TripCostResult {
  const isElectric = vehicle.fuelType === "electric";
  const unitLabel: "km/L" | "km/kWh" = isElectric ? "km/kWh" : "km/L";

  const efficiency = isElectric
    ? latestKmPerKwh(chargingEntries).kmPerKwh
    : latestKmPerLiter(fuelEntries).kmPerLiter;
  const unitPrice = isElectric ? latestUnitPriceCharging(chargingEntries) : latestUnitPrice(fuelEntries);

  const hasEnoughData = efficiency != null && efficiency > 0 && unitPrice != null;

  const fuelOrEnergyCost = hasEnoughData ? (distanceKm / (efficiency as number)) * (unitPrice as number) : null;
  const totalCost = fuelOrEnergyCost != null ? fuelOrEnergyCost + extraCosts : null;
  const costPerKm = totalCost != null && distanceKm > 0 ? totalCost / distanceKm : null;

  return {
    hasEnoughData,
    distanceKm,
    fuelOrEnergyCost,
    extraCosts,
    totalCost,
    costPerKm,
    unitLabel,
    pricePerUnitLabel: isElectric ? "per kWh" : "per liter",
  };
}

import { Vehicle } from "@/types/models";
import { UnifiedExpense } from "./fleetAnalytics";
import { fromLocalIso } from "@/utils/date";

export interface VehicleOwnershipCost {
  vehicleId: string;
  vehicleName: string;
  purchasePrice: number;
  fuelTotal: number;
  serviceTotal: number;
  chargingTotal: number;
  runningTotal: number; // fuel + service + charging
  totalCostOfOwnership: number; // purchasePrice + runningTotal
  ownershipMonths: number;
  costPerMonth: number;
  /** null when there's no odometer reading to divide by. */
  costPerKm: number | null;
}

function monthsSince(iso: string): number {
  const purchase = fromLocalIso(iso);
  const now = new Date();
  const months =
    (now.getFullYear() - purchase.getFullYear()) * 12 + (now.getMonth() - purchase.getMonth());
  return Math.max(1, months);
}

/**
 * Cost-per-km assumes the odometer started at 0 at purchase — the app
 * doesn't record an odometer-at-purchase value, so for a used vehicle
 * bought with existing mileage this understates true lifetime cost/km.
 * Always surfaced with that caveat in the UI, never silently.
 */
export function getVehicleOwnershipCost(vehicle: Vehicle, expenses: UnifiedExpense[]): VehicleOwnershipCost {
  const vehicleExpenses = expenses.filter((e) => e.vehicleId === vehicle.id);
  const fuelTotal = vehicleExpenses.filter((e) => e.category === "fuel").reduce((s, e) => s + e.cost, 0);
  const serviceTotal = vehicleExpenses.filter((e) => e.category === "service").reduce((s, e) => s + e.cost, 0);
  const chargingTotal = vehicleExpenses.filter((e) => e.category === "charging").reduce((s, e) => s + e.cost, 0);
  const runningTotal = fuelTotal + serviceTotal + chargingTotal;
  const totalCostOfOwnership = vehicle.purchasePrice + runningTotal;
  const ownershipMonths = monthsSince(vehicle.purchaseDate);

  return {
    vehicleId: vehicle.id,
    vehicleName: vehicle.name,
    purchasePrice: vehicle.purchasePrice,
    fuelTotal,
    serviceTotal,
    chargingTotal,
    runningTotal,
    totalCostOfOwnership,
    ownershipMonths,
    costPerMonth: totalCostOfOwnership / ownershipMonths,
    costPerKm: vehicle.currentOdometerKm > 0 ? totalCostOfOwnership / vehicle.currentOdometerKm : null,
  };
}

export function getHouseholdOwnershipCosts(vehicles: Vehicle[], expenses: UnifiedExpense[]): VehicleOwnershipCost[] {
  return vehicles
    .map((v) => getVehicleOwnershipCost(v, expenses))
    .sort((a, b) => b.totalCostOfOwnership - a.totalCostOfOwnership);
}

export interface OwnershipComparison {
  mostExpensiveOverall: VehicleOwnershipCost;
  lowestCostPerKm: VehicleOwnershipCost | null; // null if no vehicle has odometer data
  highestRunningCost: VehicleOwnershipCost;
}

/** Needs >= 2 vehicles — a "comparison" of one thing isn't a comparison. */
export function getOwnershipComparison(costs: VehicleOwnershipCost[]): OwnershipComparison | null {
  if (costs.length < 2) return null;

  const withKm = costs.filter((c) => c.costPerKm != null);
  const lowestCostPerKm = withKm.length > 0
    ? withKm.reduce((min, c) => (c.costPerKm! < min.costPerKm! ? c : min))
    : null;

  return {
    mostExpensiveOverall: costs.reduce((max, c) => (c.totalCostOfOwnership > max.totalCostOfOwnership ? c : max)),
    lowestCostPerKm,
    highestRunningCost: costs.reduce((max, c) => (c.runningTotal > max.runningTotal ? c : max)),
  };
}

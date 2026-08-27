import { Vehicle, ServiceLogEntry, FuelLogEntry, ChargingLogEntry, Urgency } from "@/types/models";
import { dateUrgency, pmsUrgency, worseOf } from "@/utils/urgency";

export type ExpenseCategory = "fuel" | "service" | "charging";

export interface UnifiedExpense {
  id: string;
  vehicleId: string;
  vehicleName: string;
  date: string; // ISO date
  cost: number;
  category: ExpenseCategory;
  label: string;
}

type ByVehicle<T> = Record<string, T[]>;

/** Merges fuel/service/charging entries across all vehicles into one spending timeline. */
export function getAllExpenses(
  vehicles: Vehicle[],
  fuelByVehicle: ByVehicle<FuelLogEntry>,
  serviceByVehicle: ByVehicle<ServiceLogEntry>,
  chargingByVehicle: ByVehicle<ChargingLogEntry>
): UnifiedExpense[] {
  const nameOf = (id: string) => vehicles.find((v) => v.id === id)?.name ?? "Unknown vehicle";
  const expenses: UnifiedExpense[] = [];

  for (const vehicleId of Object.keys(fuelByVehicle)) {
    for (const e of fuelByVehicle[vehicleId] ?? []) {
      expenses.push({
        id: e.id,
        vehicleId,
        vehicleName: nameOf(vehicleId),
        date: e.date,
        cost: e.cost,
        category: "fuel",
        label: "Fuel",
      });
    }
  }
  for (const vehicleId of Object.keys(serviceByVehicle)) {
    for (const e of serviceByVehicle[vehicleId] ?? []) {
      expenses.push({
        id: e.id,
        vehicleId,
        vehicleName: nameOf(vehicleId),
        date: e.date,
        cost: e.cost,
        category: "service",
        label: e.type,
      });
    }
  }
  for (const vehicleId of Object.keys(chargingByVehicle)) {
    for (const e of chargingByVehicle[vehicleId] ?? []) {
      expenses.push({
        id: e.id,
        vehicleId,
        vehicleName: nameOf(vehicleId),
        date: e.date,
        cost: e.cost,
        category: "charging",
        label: "Charging",
      });
    }
  }

  return expenses.sort((a, b) => b.date.localeCompare(a.date));
}

function monthKey(iso: string): string {
  return iso.slice(0, 7); // "YYYY-MM"
}

export function getMonthTotal(expenses: UnifiedExpense[], monthOffset = 0): number {
  const d = new Date();
  d.setMonth(d.getMonth() + monthOffset);
  const key = monthKey(d.toISOString());
  return expenses.filter((e) => monthKey(e.date) === key).reduce((sum, e) => sum + e.cost, 0);
}

export interface SpendingTrend {
  thisMonth: number;
  lastMonth: number;
  percentChange: number;
}

/** Returns null when last month has no data — a % change against zero is meaningless, not "infinite savings." */
export function getSpendingTrend(expenses: UnifiedExpense[]): SpendingTrend | null {
  const thisMonth = getMonthTotal(expenses, 0);
  const lastMonth = getMonthTotal(expenses, -1);
  if (lastMonth === 0) return null;
  return { thisMonth, lastMonth, percentChange: ((thisMonth - lastMonth) / lastMonth) * 100 };
}

export interface MonthlySpend {
  monthKey: string; // "YYYY-MM"
  monthLabel: string; // "Jan"
  total: number;
}

/** Last `months` calendar months (oldest first), including months with zero spend, for a trend chart. */
export function getMonthlySpendSeries(expenses: UnifiedExpense[], months = 6): MonthlySpend[] {
  const totalsByKey = new Map<string, number>();
  for (const e of expenses) {
    const key = monthKey(e.date);
    totalsByKey.set(key, (totalsByKey.get(key) ?? 0) + e.cost);
  }

  const series: MonthlySpend[] = [];
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(1); // avoid month-length rollover (e.g. Mar 31 - 1mo != Feb)
    d.setMonth(d.getMonth() - i);
    const key = monthKey(d.toISOString());
    series.push({
      monthKey: key,
      monthLabel: d.toLocaleDateString("en-US", { month: "short" }),
      total: totalsByKey.get(key) ?? 0,
    });
  }
  return series;
}

export interface VehicleSpend {
  vehicleId: string;
  vehicleName: string;
  total: number;
  share: number; // 0-1 of total household spend
}

export function getSpendByVehicle(expenses: UnifiedExpense[]): VehicleSpend[] {
  const totals = new Map<string, { vehicleName: string; total: number }>();
  let grandTotal = 0;
  for (const e of expenses) {
    const existing = totals.get(e.vehicleId) ?? { vehicleName: e.vehicleName, total: 0 };
    existing.total += e.cost;
    totals.set(e.vehicleId, existing);
    grandTotal += e.cost;
  }
  return [...totals.entries()]
    .map(([vehicleId, v]) => ({
      vehicleId,
      vehicleName: v.vehicleName,
      total: v.total,
      share: grandTotal > 0 ? v.total / grandTotal : 0,
    }))
    .sort((a, b) => b.total - a.total);
}

export function getSpendByCategory(expenses: UnifiedExpense[]): Record<ExpenseCategory, number> {
  const totals: Record<ExpenseCategory, number> = { fuel: 0, service: 0, charging: 0 };
  for (const e of expenses) totals[e.category] += e.cost;
  return totals;
}

export interface ActionItem {
  vehicleId: string;
  vehicleName: string;
  kind: "registration" | "insurance" | "pms";
  urgency: Urgency;
  label: string;
  dateLabel: string; // ISO date it's due/expires
}

/** Aggregates the same registration/insurance/PMS urgency check every vehicle already computes, across the whole household. */
export function getActionItems(vehicles: Vehicle[]): ActionItem[] {
  const items: ActionItem[] = [];
  for (const v of vehicles) {
    const registration = dateUrgency(v.registrationExpiry);
    const insurance = dateUrgency(v.insuranceExpiry);
    const pms = pmsUrgency(v.nextPmsDueDate, v.nextPmsDueKm, v.currentOdometerKm);

    if (registration !== "ok") {
      items.push({ vehicleId: v.id, vehicleName: v.name, kind: "registration", urgency: registration, label: "Registration", dateLabel: v.registrationExpiry });
    }
    if (insurance !== "ok") {
      items.push({ vehicleId: v.id, vehicleName: v.name, kind: "insurance", urgency: insurance, label: "Insurance", dateLabel: v.insuranceExpiry });
    }
    if (pms !== "ok") {
      items.push({ vehicleId: v.id, vehicleName: v.name, kind: "pms", urgency: pms, label: "Next PMS", dateLabel: v.nextPmsDueDate });
    }
  }

  const rank: Record<Urgency, number> = { overdue: 0, due_soon: 1, ok: 2 };
  return items.sort((a, b) => rank[a.urgency] - rank[b.urgency] || a.dateLabel.localeCompare(b.dateLabel));
}

/** Worst urgency across every vehicle's registration/insurance/PMS — drives the dashboard's overall household status. */
export function getHouseholdUrgency(vehicles: Vehicle[]): Urgency {
  let worst: Urgency = "ok";
  for (const item of getActionItems(vehicles)) {
    worst = worseOf(worst, item.urgency);
  }
  return worst;
}

export type Insight = { text: string; kind: "trend" | "share" | "economy" };

const MIN_EXPENSES_FOR_INSIGHTS = 4;

/**
 * Produces observations strictly from real data — never fabricated. Below
 * MIN_EXPENSES_FOR_INSIGHTS, or with fewer than 2 vehicles carrying spend,
 * a given insight is simply omitted rather than guessed at.
 */
export function getFleetInsights(expenses: UnifiedExpense[]): Insight[] {
  if (expenses.length < MIN_EXPENSES_FOR_INSIGHTS) return [];

  const insights: Insight[] = [];

  const trend = getSpendingTrend(expenses);
  if (trend && Math.abs(trend.percentChange) >= 1) {
    const direction = trend.percentChange > 0 ? "more" : "less";
    insights.push({
      kind: "trend",
      text: `Your household is trending ${Math.abs(trend.percentChange).toFixed(0)}% ${direction} on vehicle spending than last month.`,
    });
  }

  const byVehicle = getSpendByVehicle(expenses);
  if (byVehicle.length >= 2 && byVehicle[0].share >= 0.4) {
    insights.push({
      kind: "share",
      text: `${byVehicle[0].vehicleName} represents ${(byVehicle[0].share * 100).toFixed(0)}% of your household vehicle spending.`,
    });
  }

  return insights;
}

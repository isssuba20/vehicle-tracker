import { ServiceLogEntry } from "@/types/models";

export interface MaintenancePrediction {
  type: string;
  intervalsUsed: number;
  avgIntervalKm: number;
  lastServiceOdometerKm: number;
  predictedDueOdometerKm: number;
  /** Negative means the predicted point has already passed — still labeled "predicted," never "overdue" (that word is reserved for scheduled PMS). */
  kmRemaining: number;
}

const MIN_ENTRIES_PER_TYPE = 3; // needs >= 2 intervals to average

/**
 * Estimates when a recurring service type is next likely due, purely from
 * this vehicle's own history (grouped by service type, e.g. "Oil change").
 * Deliberately separate from the scheduled nextPmsDueDate/Km on Vehicle —
 * this is a pattern-based guess, never presented as manufacturer-required
 * maintenance. Returns nothing for a type with too little history, per
 * the app's rule against showing a prediction the data can't support.
 */
export function getMaintenancePredictions(
  entries: ServiceLogEntry[],
  currentOdometerKm: number
): MaintenancePrediction[] {
  const byType = new Map<string, ServiceLogEntry[]>();
  for (const e of entries) {
    const key = e.type.trim().toLowerCase();
    if (!key) continue;
    if (!byType.has(key)) byType.set(key, []);
    byType.get(key)!.push(e);
  }

  const predictions: MaintenancePrediction[] = [];
  for (const list of byType.values()) {
    if (list.length < MIN_ENTRIES_PER_TYPE) continue;

    const sorted = [...list].sort((a, b) => a.odometerKm - b.odometerKm);
    const intervals: number[] = [];
    for (let i = 1; i < sorted.length; i++) {
      const delta = sorted[i].odometerKm - sorted[i - 1].odometerKm;
      if (delta > 0) intervals.push(delta);
    }
    if (intervals.length < 2) continue;

    const avgIntervalKm = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    const last = sorted[sorted.length - 1];
    const predictedDueOdometerKm = last.odometerKm + avgIntervalKm;

    predictions.push({
      type: last.type,
      intervalsUsed: intervals.length,
      avgIntervalKm: Math.round(avgIntervalKm),
      lastServiceOdometerKm: last.odometerKm,
      predictedDueOdometerKm: Math.round(predictedDueOdometerKm),
      kmRemaining: Math.round(predictedDueOdometerKm - currentOdometerKm),
    });
  }

  return predictions.sort((a, b) => a.kmRemaining - b.kmRemaining);
}

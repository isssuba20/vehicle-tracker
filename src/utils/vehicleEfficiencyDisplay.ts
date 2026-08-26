import { Vehicle, FuelLogEntry, ChargingLogEntry } from "@/types/models";
import { latestKmPerLiter } from "./fuelEfficiency";
import { latestKmPerKwh } from "./chargingEfficiency";
import { formatKmPerLiter, formatKmPerKwh } from "./format";

export interface EfficiencyDisplay {
  label: string;
  text: string;
  implausible: boolean;
}

/**
 * Picks km/L (gas/hybrid, from fuel entries) or km/kWh (electric, from
 * charging entries) depending on the vehicle's fuel type, and formats it.
 * Centralized so the Dashboard card and the Overview tab never disagree
 * about which metric a given vehicle should show.
 */
export function getEfficiencyDisplay(
  vehicle: Vehicle,
  fuelEntries: FuelLogEntry[],
  chargingEntries: ChargingLogEntry[]
): EfficiencyDisplay {
  if (vehicle.fuelType === "electric") {
    const eff = latestKmPerKwh(chargingEntries);
    return {
      label: "Charging efficiency",
      text: formatKmPerKwh(eff.kmPerKwh, eff.implausible),
      implausible: eff.implausible,
    };
  }
  const eff = latestKmPerLiter(fuelEntries);
  return {
    label: "Fuel efficiency",
    text: formatKmPerLiter(eff.kmPerLiter, eff.implausible),
    implausible: eff.implausible,
  };
}

import { Vehicle, ServiceLogEntry, FuelLogEntry, ChargingLogEntry } from "@/types/models";

type ByVehicle<T> = Record<string, T[]>;

function csvCell(value: string | number | undefined | null): string {
  const s = value == null ? "" : String(value);
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function csvRow(cells: (string | number | undefined | null)[]): string {
  return cells.map(csvCell).join(",");
}

/**
 * A full household data dump — every vehicle's own fields plus every
 * fuel/service/charging entry across the whole fleet, as CSV. This is
 * the "back everything up / open it in a spreadsheet" export; distinct
 * from vehicleReport.ts, which builds a single vehicle's prose history
 * for sharing with a buyer. Two CSV tables in one text file (no zip/xlsx
 * library — Share.share() only sends text) since a vehicle and a log
 * entry don't share a row shape.
 */
export function buildHouseholdExportCsv(
  vehicles: Vehicle[],
  serviceByVehicle: ByVehicle<ServiceLogEntry>,
  fuelByVehicle: ByVehicle<FuelLogEntry>,
  chargingByVehicle: ByVehicle<ChargingLogEntry>,
  currencyCode: string
): string {
  const lines: string[] = [];

  lines.push(`Garahe household export — generated ${new Date().toISOString().slice(0, 10)} — amounts in ${currencyCode}`);
  lines.push("");

  lines.push("VEHICLES");
  lines.push(
    csvRow([
      "Name",
      "Make",
      "Model",
      "Year",
      "Plate",
      "VIN",
      "Color",
      "Fuel type",
      "Purchase date",
      "Purchase price",
      "Current odometer (km)",
      "Registration expiry",
      "Insurance expiry",
      "Next PMS date",
      "Next PMS km",
    ])
  );
  for (const v of vehicles) {
    lines.push(
      csvRow([
        v.name,
        v.make,
        v.model,
        v.year,
        v.plateNumber,
        v.vin,
        v.color,
        v.fuelType,
        v.purchaseDate,
        v.purchasePrice,
        v.currentOdometerKm,
        v.registrationExpiry,
        v.insuranceExpiry,
        v.nextPmsDueDate,
        v.nextPmsDueKm,
      ])
    );
  }

  lines.push("");
  lines.push("ENTRIES");
  lines.push(csvRow(["Vehicle", "Category", "Date", "Odometer (km)", "Detail", "Quantity", "Unit", "Cost"]));

  const nameOf = (id: string) => vehicles.find((v) => v.id === id)?.name ?? "Unknown vehicle";

  const rows: { vehicleId: string; date: string; row: (string | number | undefined)[] }[] = [];

  for (const vehicleId of Object.keys(serviceByVehicle)) {
    for (const e of serviceByVehicle[vehicleId] ?? []) {
      const detail = [e.type, e.shop, e.notes].filter(Boolean).join(" — ");
      rows.push({
        vehicleId,
        date: e.date,
        row: [nameOf(vehicleId), "Service", e.date, e.odometerKm, detail, undefined, undefined, e.cost],
      });
    }
  }
  for (const vehicleId of Object.keys(fuelByVehicle)) {
    for (const e of fuelByVehicle[vehicleId] ?? []) {
      rows.push({
        vehicleId,
        date: e.date,
        row: [nameOf(vehicleId), "Fuel", e.date, e.odometerKm, "Fill-up", e.liters, "L", e.cost],
      });
    }
  }
  for (const vehicleId of Object.keys(chargingByVehicle)) {
    for (const e of chargingByVehicle[vehicleId] ?? []) {
      rows.push({
        vehicleId,
        date: e.date,
        row: [nameOf(vehicleId), "Charging", e.date, e.odometerKm, "Charge", e.kwh, "kWh", e.cost],
      });
    }
  }

  rows.sort((a, b) => a.date.localeCompare(b.date) || a.vehicleId.localeCompare(b.vehicleId));
  for (const r of rows) lines.push(csvRow(r.row));

  return lines.join("\n");
}

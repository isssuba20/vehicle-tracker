import { fromLocalIso } from "./date";

/** Formats a number as currency. Intl handles the right symbol/placement per ISO code regardless of locale. */
export function formatMoney(amount: number, currencyCode: string): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currencyCode,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatKm(km: number): string {
  return `${km.toLocaleString("en-PH", { maximumFractionDigits: 0 })} km`;
}

export function formatKmPerLiter(value: number | null, implausible = false): string {
  if (value == null) return "—";
  if (implausible) return "Check entry";
  return `${value.toFixed(1)} km/L`;
}

export function formatKmPerKwh(value: number | null, implausible = false): string {
  if (value == null) return "—";
  if (implausible) return "Check entry";
  return `${value.toFixed(1)} km/kWh`;
}

// new Date(iso) on a date-only string parses as UTC midnight, which
// toLocaleDateString() then renders in the device's local timezone —
// for a negative UTC offset that can display a day earlier than the
// date actually stored. fromLocalIso() anchors to local midnight
// instead, so what's displayed always matches what's stored.
export function formatDate(iso: string): string {
  const d = fromLocalIso(iso);
  return d.toLocaleDateString("en-PH", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatDateShort(iso: string): string {
  const d = fromLocalIso(iso);
  return d.toLocaleDateString("en-PH", { month: "short", day: "numeric" });
}

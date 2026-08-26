export function formatPeso(amount: number): string {
  return `₱${amount.toLocaleString("en-PH", { maximumFractionDigits: 0 })}`;
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

export function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-PH", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatDateShort(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-PH", { month: "short", day: "numeric" });
}

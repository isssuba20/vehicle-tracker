import { Urgency } from "@/types/models";

export const colors = {
  background: "#22262B",
  surface: "#2B3036",
  border: "#454B53",

  textPrimary: "#F3EFE7",
  textMuted: "#9A958C",
  textFaint: "#8A8579",

  accent: "#E2A335",
  onAccent: "#22262B",

  // Locked identity colors — used for badges, dots, and other small
  // accents where the exact brand hue matters. Not legible as direct
  // foreground text on the dark background/surface (see *Bright below).
  ok: "#2E6B63",
  dueSoon: "#E2A335",
  overdue: "#C1483A",

  // Brighter same-family variants for the few spots where a status
  // color is used as plain text directly on background/surface
  // (error copy, the "Delete vehicle" label, a good km/L reading).
  // The locked colors above fail 4.5:1 in that role on this dark
  // theme; these pass ~4.6–5.4:1 while staying visually paired.
  okBright: "#4FA89C",
  overdueBright: "#E06A56",
} as const;

export const fonts = {
  display: "Oswald_600SemiBold",
  displayMedium: "Oswald_500Medium",
  mono: "JetBrainsMono_500Medium",
  monoRegular: "JetBrainsMono_400Regular",
  body: "Inter_400Regular",
  bodyMedium: "Inter_500Medium",
  bodySemiBold: "Inter_600SemiBold",
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
} as const;

export const radii = {
  sm: 8,
  md: 14,
  lg: 20,
  pill: 999,
} as const;

export function urgencyColor(u: Urgency): string {
  if (u === "overdue") return colors.overdue;
  if (u === "due_soon") return colors.dueSoon;
  return colors.ok;
}

/** Text color to use on top of a solid urgencyColor() fill (e.g. a badge chip). */
export function urgencyOnColor(u: Urgency): string {
  if (u === "due_soon") return colors.onAccent;
  return colors.textPrimary;
}

export function urgencyLabel(u: Urgency): string {
  if (u === "overdue") return "Overdue";
  if (u === "due_soon") return "Due soon";
  return "OK";
}

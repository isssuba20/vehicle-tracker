import { Urgency } from "@/types/models";

export interface ThemeColors {
  background: string;
  surface: string;
  border: string;

  textPrimary: string;
  textMuted: string;
  textFaint: string;

  accent: string;
  onAccent: string;

  // Locked identity colors — same in both modes, used for badges, dots,
  // and other small accents where the exact brand hue matters.
  ok: string;
  dueSoon: string;
  overdue: string;

  // Same-family variants for the few spots where a status color is used
  // as plain text directly on the background/surface. On the dark theme
  // the locked colors above don't have enough contrast there, so these
  // are brighter; on the light theme the locked colors already work
  // fine as text, so these just equal them.
  okBright: string;
  overdueBright: string;
}

export const darkColors: ThemeColors = {
  background: "#22262B",
  surface: "#2B3036",
  border: "#454B53",

  textPrimary: "#F3EFE7",
  textMuted: "#9A958C",
  textFaint: "#8A8579",

  accent: "#E2A335",
  onAccent: "#22262B",

  ok: "#2E6B63",
  dueSoon: "#E2A335",
  overdue: "#C1483A",

  okBright: "#4FA89C",
  overdueBright: "#E06A56",
};

export const lightColors: ThemeColors = {
  background: "#F3EFE7",
  surface: "#FFFFFF",
  border: "#DFD8C8",

  textPrimary: "#22262B",
  textMuted: "#5B5F66",
  textFaint: "#8B8E94",

  accent: "#E2A335",
  onAccent: "#22262B",

  ok: "#2E6B63",
  dueSoon: "#E2A335",
  overdue: "#C1483A",

  okBright: "#2E6B63",
  overdueBright: "#C1483A",
};

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

// Status colors (ok/dueSoon/overdue) are identical in both themes, so
// urgency badges/dots don't need to know the current mode.
const STATUS = { ok: darkColors.ok, dueSoon: darkColors.dueSoon, overdue: darkColors.overdue };
const STATUS_TEXT_LIGHT = "#F3EFE7";
const STATUS_TEXT_DARK = "#22262B";

export function urgencyColor(u: Urgency): string {
  if (u === "overdue") return STATUS.overdue;
  if (u === "due_soon") return STATUS.dueSoon;
  return STATUS.ok;
}

/** Text color to use on top of a solid urgencyColor() fill (e.g. a badge chip). */
export function urgencyOnColor(u: Urgency): string {
  if (u === "due_soon") return STATUS_TEXT_DARK;
  return STATUS_TEXT_LIGHT;
}

export function urgencyLabel(u: Urgency): string {
  if (u === "overdue") return "Overdue";
  if (u === "due_soon") return "Due soon";
  return "OK";
}

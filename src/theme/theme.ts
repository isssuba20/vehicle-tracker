import { Urgency } from "@/types/models";

export interface ThemeColors {
  background: string;
  surface: string;
  surfaceElevated: string;
  border: string;

  textPrimary: string;
  textMuted: string;
  textFaint: string;

  accent: string;
  accentHover: string;
  accentMuted: string;
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

  // Fixed categorical hues for the spending-by-category chart (fuel/
  // service/charging) — a small, deliberately ordered set, never cycled
  // or reused for status meaning elsewhere.
  chartFuel: string;
  chartService: string;
  chartCharging: string;
}

/**
 * Premium automotive palette: deep charcoal foundation, warm metallic
 * gold accent used sparingly, off-white type. This is the app's primary,
 * fully-specified look.
 */
export const darkColors: ThemeColors = {
  background: "#111416",
  surface: "#191D20",
  surfaceElevated: "#202529",
  border: "#303538",

  textPrimary: "#F2F0EA",
  textMuted: "#A7AAA8",
  textFaint: "#6F7473",

  accent: "#D9A23A",
  accentHover: "#E7B34D",
  accentMuted: "#A77A2B",
  onAccent: "#111416",

  ok: "#2E6B63",
  dueSoon: "#D9A23A",
  overdue: "#C1483A",

  okBright: "#4FA89C",
  overdueBright: "#E06A56",

  chartFuel: "#D9A23A",
  chartService: "#6C89A6",
  chartCharging: "#4FA89C",
};

/**
 * Light complement to the dark palette above, derived rather than
 * specified: same restraint and the same gold family, adapted so a full
 * gold accent (which reads poorly as foreground text/icon color on a
 * light ground) stays legible — see DECISIONS.md.
 */
export const lightColors: ThemeColors = {
  background: "#F5F2EA",
  surface: "#FFFFFF",
  surfaceElevated: "#EFEAE0",
  border: "#DED7C8",

  textPrimary: "#15181A",
  textMuted: "#5B5F5D",
  textFaint: "#83867F",

  accent: "#B8862E",
  accentHover: "#C89434",
  accentMuted: "#8C6423",
  onAccent: "#15181A",

  ok: "#2E6B63",
  dueSoon: "#B8862E",
  overdue: "#C1483A",

  okBright: "#2E6B63",
  overdueBright: "#C1483A",

  chartFuel: "#B8862E",
  chartService: "#5A7690",
  chartCharging: "#2E6B63",
};

export const fonts = {
  display: "Manrope_600SemiBold",
  displayMedium: "Manrope_500Medium",
  mono: "JetBrainsMono_500Medium",
  monoRegular: "JetBrainsMono_400Regular",
  body: "Manrope_400Regular",
  bodyMedium: "Manrope_500Medium",
  bodySemiBold: "Manrope_600SemiBold",
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
} as const;

// Restrained corner radii — a premium control surface, not a rounded
// consumer-app look.
export const radii = {
  sm: 6,
  md: 8,
  lg: 10,
} as const;

// Status colors (ok/dueSoon/overdue) are identical in both themes, so
// urgency badges/dots don't need to know the current mode.
const STATUS = { ok: darkColors.ok, dueSoon: darkColors.dueSoon, overdue: darkColors.overdue };
const STATUS_TEXT_LIGHT = "#F2F0EA";
const STATUS_TEXT_DARK = "#111416";

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

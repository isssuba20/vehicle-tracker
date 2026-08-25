import { Urgency } from "@/types/models";

export const colors = {
  paper: "#F3EFE7",
  paperRaised: "#FFFFFF",
  ink: "#22262B",
  inkMuted: "#5B5F66",
  inkFaint: "#8B8E94",
  border: "#DFD8C8",

  ok: "#2E6B63",
  okBg: "#E4EEEC",
  dueSoon: "#E2A335",
  dueSoonBg: "#FBF0DC",
  overdue: "#C1483A",
  overdueBg: "#F6E1DD",
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

export function urgencyBgColor(u: Urgency): string {
  if (u === "overdue") return colors.overdueBg;
  if (u === "due_soon") return colors.dueSoonBg;
  return colors.okBg;
}

export function urgencyLabel(u: Urgency): string {
  if (u === "overdue") return "Overdue";
  if (u === "due_soon") return "Due soon";
  return "OK";
}

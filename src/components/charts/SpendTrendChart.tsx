import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { fonts, radii, spacing, ThemeColors } from "@/theme/theme";
import { useThemeStore } from "@/theme/useThemeStore";
import { MonthlySpend } from "@/services/fleetAnalytics";
import { formatMoney } from "@/utils/format";

const CHART_HEIGHT = 110;
const MIN_BAR_HEIGHT = 3;

/**
 * A single-series monthly spend trend, drawn with plain Views (no chart
 * library / no new dependency — this ships via OTA like everything else).
 * One hue only, since this is one measure over time, not a category
 * comparison — see SpendByCategoryChart for the categorical case.
 */
export function SpendTrendChart({ series, currencyCode }: { series: MonthlySpend[]; currencyCode: string }) {
  const colors = useThemeStore((s) => s.colors);
  const styles = makeStyles(colors);

  const hasAnySpend = series.some((m) => m.total > 0);
  const maxValue = Math.max(...series.map((m) => m.total), 1);

  if (!hasAnySpend) {
    return (
      <View style={styles.emptyBox}>
        <Text style={styles.emptyText}>
          Log fuel, service, or charging entries and your household's monthly spending trend will show up
          here.
        </Text>
      </View>
    );
  }

  const lastIndex = series.length - 1;

  return (
    <View style={styles.container}>
      <View style={styles.chartArea}>
        {series.map((m, i) => {
          const barHeight = m.total > 0 ? Math.max((m.total / maxValue) * CHART_HEIGHT, MIN_BAR_HEIGHT) : MIN_BAR_HEIGHT;
          const isCurrent = i === lastIndex;
          return (
            <View key={m.monthKey} style={styles.barColumn}>
              {m.total > 0 && (
                <Text style={styles.barValue} numberOfLines={1}>
                  {formatMoney(m.total, currencyCode)}
                </Text>
              )}
              <View
                style={[
                  styles.bar,
                  { height: barHeight, backgroundColor: isCurrent ? colors.accent : colors.accentMuted },
                ]}
              />
              <Text style={[styles.barLabel, isCurrent && styles.barLabelCurrent]}>{m.monthLabel}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      backgroundColor: colors.surface,
      borderRadius: radii.lg,
      borderWidth: 1,
      borderColor: colors.border,
      padding: spacing.md,
    },
    chartArea: {
      flexDirection: "row",
      alignItems: "flex-end",
      justifyContent: "space-between",
      height: CHART_HEIGHT + 36,
    },
    barColumn: {
      flex: 1,
      alignItems: "center",
      justifyContent: "flex-end",
    },
    barValue: {
      fontFamily: fonts.mono,
      fontSize: 9,
      color: colors.textFaint,
      marginBottom: 3,
    },
    bar: {
      width: "60%",
      borderTopLeftRadius: radii.sm,
      borderTopRightRadius: radii.sm,
    },
    barLabel: {
      fontFamily: fonts.body,
      fontSize: 11,
      color: colors.textFaint,
      marginTop: spacing.xs,
    },
    barLabelCurrent: {
      color: colors.textPrimary,
      fontFamily: fonts.bodySemiBold,
    },
    emptyBox: {
      backgroundColor: colors.surface,
      borderRadius: radii.lg,
      borderWidth: 1,
      borderColor: colors.border,
      padding: spacing.md,
    },
    emptyText: {
      fontFamily: fonts.body,
      fontSize: 13,
      color: colors.textMuted,
    },
  });

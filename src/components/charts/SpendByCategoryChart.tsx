import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { fonts, radii, spacing, ThemeColors } from "@/theme/theme";
import { useThemeStore } from "@/theme/useThemeStore";
import { ExpenseCategory } from "@/services/fleetAnalytics";
import { formatMoney } from "@/utils/format";

const CATEGORY_LABEL: Record<ExpenseCategory, string> = {
  fuel: "Fuel",
  service: "Service & repairs",
  charging: "Charging",
};

/**
 * Horizontal bars comparing where household vehicle spend goes. Fixed
 * categorical colors (theme.chartFuel/chartService/chartCharging),
 * never cycled. A category with zero spend is omitted rather than shown
 * as a meaningless empty bar — e.g. an all-gas household never sees a
 * "Charging" row.
 */
export function SpendByCategoryChart({
  totals,
  currencyCode,
}: {
  totals: Record<ExpenseCategory, number>;
  currencyCode: string;
}) {
  const colors = useThemeStore((s) => s.colors);
  const styles = makeStyles(colors);
  const categoryColor: Record<ExpenseCategory, string> = {
    fuel: colors.chartFuel,
    service: colors.chartService,
    charging: colors.chartCharging,
  };

  const grandTotal = totals.fuel + totals.service + totals.charging;
  const rows = (Object.keys(totals) as ExpenseCategory[])
    .filter((c) => totals[c] > 0)
    .sort((a, b) => totals[b] - totals[a]);

  if (rows.length === 0) {
    return (
      <View style={styles.emptyBox}>
        <Text style={styles.emptyText}>No spending logged yet to break down by category.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {rows.map((c) => {
        const share = grandTotal > 0 ? totals[c] / grandTotal : 0;
        return (
          <View key={c} style={styles.row}>
            <View style={styles.rowHeader}>
              <View style={styles.labelGroup}>
                <View style={[styles.swatch, { backgroundColor: categoryColor[c] }]} />
                <Text style={styles.label}>{CATEGORY_LABEL[c]}</Text>
              </View>
              <Text style={styles.value}>{formatMoney(totals[c], currencyCode)}</Text>
            </View>
            <View style={styles.track}>
              <View style={[styles.fill, { width: `${Math.max(share * 100, 2)}%`, backgroundColor: categoryColor[c] }]} />
            </View>
          </View>
        );
      })}
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
    row: {
      marginBottom: spacing.sm,
    },
    rowHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 4,
    },
    labelGroup: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },
    swatch: {
      width: 8,
      height: 8,
      borderRadius: 4,
    },
    label: {
      fontFamily: fonts.body,
      fontSize: 13,
      color: colors.textMuted,
    },
    value: {
      fontFamily: fonts.mono,
      fontSize: 13,
      color: colors.textPrimary,
    },
    track: {
      height: 6,
      borderRadius: 3,
      backgroundColor: colors.background,
      overflow: "hidden",
    },
    fill: {
      height: "100%",
      borderRadius: 3,
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

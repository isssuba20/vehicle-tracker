import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { fonts, radii, spacing, ThemeColors } from "@/theme/theme";
import { useThemeStore } from "@/theme/useThemeStore";
import { formatMoney } from "@/utils/format";
import { OwnershipComparison } from "@/services/ownershipCost";

export function OwnershipComparisonCard({
  comparison,
  currencyCode,
}: {
  comparison: OwnershipComparison;
  currencyCode: string;
}) {
  const colors = useThemeStore((s) => s.colors);
  const styles = makeStyles(colors);

  const rows = [
    {
      label: "Most expensive to own",
      value: comparison.mostExpensiveOverall.vehicleName,
      detail: formatMoney(comparison.mostExpensiveOverall.totalCostOfOwnership, currencyCode),
    },
    {
      label: "Highest running costs",
      value: comparison.highestRunningCost.vehicleName,
      detail: `${formatMoney(comparison.highestRunningCost.runningTotal, currencyCode)} logged`,
    },
    ...(comparison.lowestCostPerKm
      ? [
          {
            label: "Lowest cost per km",
            value: comparison.lowestCostPerKm.vehicleName,
            detail: `${formatMoney(comparison.lowestCostPerKm.costPerKm!, currencyCode)}/km`,
          },
        ]
      : []),
  ];

  return (
    <View style={styles.container}>
      {rows.map((row, i) => (
        <View key={row.label} style={[styles.row, i > 0 && styles.rowDivider]}>
          <Text style={styles.label}>{row.label}</Text>
          <View style={styles.valueRow}>
            <Text style={styles.value}>{row.value}</Text>
            <Text style={styles.detail}>{row.detail}</Text>
          </View>
        </View>
      ))}
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
      overflow: "hidden",
    },
    row: {
      padding: spacing.md,
    },
    rowDivider: {
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.border,
    },
    label: {
      fontFamily: fonts.body,
      fontSize: 11,
      color: colors.textFaint,
      textTransform: "uppercase",
      letterSpacing: 0.4,
    },
    valueRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "baseline",
      marginTop: 3,
    },
    value: {
      fontFamily: fonts.bodySemiBold,
      fontSize: 15,
      color: colors.textPrimary,
    },
    detail: {
      fontFamily: fonts.mono,
      fontSize: 13,
      color: colors.textMuted,
    },
  });

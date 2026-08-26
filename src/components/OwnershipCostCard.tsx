import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { fonts, radii, spacing, ThemeColors } from "@/theme/theme";
import { useThemeStore } from "@/theme/useThemeStore";
import { formatMoney } from "@/utils/format";
import { VehicleOwnershipCost } from "@/services/ownershipCost";

export function OwnershipCostCard({ cost, currencyCode }: { cost: VehicleOwnershipCost; currencyCode: string }) {
  const colors = useThemeStore((s) => s.colors);
  const styles = makeStyles(colors);

  return (
    <View style={styles.container}>
      <View style={styles.grid}>
        <Figure label="Total cost" value={formatMoney(cost.totalCostOfOwnership, currencyCode)} styles={styles} />
        <Figure label="Purchase price" value={formatMoney(cost.purchasePrice, currencyCode)} styles={styles} />
        <Figure label="Running costs" value={formatMoney(cost.runningTotal, currencyCode)} styles={styles} />
        <Figure label="Cost / month" value={formatMoney(cost.costPerMonth, currencyCode)} styles={styles} />
        <Figure
          label="Cost / km"
          value={cost.costPerKm != null ? formatMoney(cost.costPerKm, currencyCode) : "—"}
          styles={styles}
        />
        <Figure label="Owned" value={`${cost.ownershipMonths} mo.`} styles={styles} />
      </View>
      <Text style={styles.caveat}>
        Running costs are fuel, service, and charging entries logged in the app. Cost/km assumes
        the odometer started at 0 at purchase.
      </Text>
    </View>
  );
}

function Figure({ label, value, styles }: { label: string; value: string; styles: ReturnType<typeof makeStyles> }) {
  return (
    <View style={styles.figure}>
      <Text style={styles.figureLabel}>{label}</Text>
      <Text style={styles.figureValue}>{value}</Text>
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
    grid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: spacing.md,
    },
    figure: {
      width: "30%",
    },
    figureLabel: {
      fontFamily: fonts.body,
      fontSize: 10,
      color: colors.textFaint,
      textTransform: "uppercase",
      letterSpacing: 0.4,
    },
    figureValue: {
      fontFamily: fonts.mono,
      fontSize: 14,
      color: colors.textPrimary,
      marginTop: 2,
    },
    caveat: {
      fontFamily: fonts.body,
      fontSize: 11,
      color: colors.textFaint,
      marginTop: spacing.md,
      lineHeight: 16,
    },
  });

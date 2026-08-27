import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { fonts, radii, spacing, ThemeColors } from "@/theme/theme";
import { useThemeStore } from "@/theme/useThemeStore";
import { formatDate, formatMoney } from "@/utils/format";
import { UnifiedExpense } from "@/services/fleetAnalytics";

const CATEGORY_VERB: Record<UnifiedExpense["category"], string> = {
  fuel: "Fuel logged",
  service: "Service logged",
  charging: "Charging logged",
};

export function ActivityFeed({ expenses, currencyCode }: { expenses: UnifiedExpense[]; currencyCode: string }) {
  const colors = useThemeStore((s) => s.colors);
  const styles = makeStyles(colors);
  const categoryColor: Record<UnifiedExpense["category"], string> = {
    fuel: colors.chartFuel,
    service: colors.chartService,
    charging: colors.chartCharging,
  };

  if (expenses.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.emptyText}>No activity yet — log fuel, service, or charging to see it here.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {expenses.slice(0, 6).map((e, i) => (
        <View key={e.id} style={[styles.row, i > 0 && styles.rowDivider]}>
          <View style={[styles.dot, { backgroundColor: categoryColor[e.category] }]} />
          <View style={styles.rowContent}>
            <Text style={styles.title}>
              {e.category === "service" ? e.label : CATEGORY_VERB[e.category]} — {e.vehicleName}
            </Text>
            <Text style={styles.subtitle}>{formatDate(e.date)}</Text>
          </View>
          <Text style={styles.amount}>{formatMoney(e.cost, currencyCode)}</Text>
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
      flexDirection: "row",
      alignItems: "center",
      padding: spacing.md,
    },
    rowDivider: {
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.border,
    },
    dot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      marginRight: spacing.sm,
    },
    rowContent: {
      flex: 1,
    },
    title: {
      fontFamily: fonts.bodyMedium,
      fontSize: 13,
      color: colors.textPrimary,
    },
    subtitle: {
      fontFamily: fonts.mono,
      fontSize: 11,
      color: colors.textMuted,
      marginTop: 2,
    },
    amount: {
      fontFamily: fonts.mono,
      fontSize: 13,
      color: colors.textPrimary,
      marginLeft: spacing.sm,
    },
    emptyText: {
      fontFamily: fonts.body,
      fontSize: 13,
      color: colors.textMuted,
      padding: spacing.md,
      lineHeight: 19,
    },
  });

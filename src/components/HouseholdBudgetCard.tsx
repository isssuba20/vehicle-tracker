import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { fonts, radii, spacing, ThemeColors } from "@/theme/theme";
import { useThemeStore } from "@/theme/useThemeStore";
import { formatMoney } from "@/utils/format";

export function HouseholdBudgetCard({
  monthlyBudget,
  actual,
  currencyCode,
}: {
  monthlyBudget: number | undefined;
  actual: number;
  currencyCode: string;
}) {
  const colors = useThemeStore((s) => s.colors);
  const styles = makeStyles(colors);

  if (!monthlyBudget) {
    return (
      <View style={styles.container}>
        <Text style={styles.noBudgetTitle}>
          {actual > 0
            ? `Spent ${formatMoney(actual, currencyCode)} this month`
            : "No spending recorded this month"}
        </Text>
        <Text style={styles.noBudgetBody}>
          Set a monthly household budget in Settings to track it against actual spending here.
        </Text>
      </View>
    );
  }

  const remaining = monthlyBudget - actual;
  const overBudget = remaining < 0;
  const usedFraction = Math.min(1, actual / monthlyBudget);

  return (
    <View style={styles.container}>
      <View style={styles.barTrack}>
        <View
          style={[
            styles.barFill,
            { width: `${usedFraction * 100}%`, backgroundColor: overBudget ? colors.overdue : colors.accent },
          ]}
        />
      </View>
      <View style={styles.figuresRow}>
        <View style={styles.figure}>
          <Text style={styles.figureLabel}>Budget</Text>
          <Text style={styles.figureValue}>{formatMoney(monthlyBudget, currencyCode)}</Text>
        </View>
        <View style={styles.figure}>
          <Text style={styles.figureLabel}>Actual</Text>
          <Text style={styles.figureValue}>{formatMoney(actual, currencyCode)}</Text>
        </View>
        <View style={styles.figure}>
          <Text style={styles.figureLabel}>{overBudget ? "Over by" : "Remaining"}</Text>
          <Text style={[styles.figureValue, overBudget && styles.figureValueWarning]}>
            {formatMoney(Math.abs(remaining), currencyCode)}
          </Text>
        </View>
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
    barTrack: {
      height: 6,
      borderRadius: 3,
      backgroundColor: colors.background,
      overflow: "hidden",
      marginBottom: spacing.md,
    },
    barFill: {
      height: "100%",
      borderRadius: 3,
    },
    figuresRow: {
      flexDirection: "row",
      justifyContent: "space-between",
    },
    figure: {},
    figureLabel: {
      fontFamily: fonts.body,
      fontSize: 11,
      color: colors.textFaint,
      textTransform: "uppercase",
      letterSpacing: 0.5,
    },
    figureValue: {
      fontFamily: fonts.mono,
      fontSize: 15,
      color: colors.textPrimary,
      marginTop: 2,
    },
    figureValueWarning: {
      color: colors.overdueBright,
    },
    noBudgetTitle: {
      fontFamily: fonts.bodySemiBold,
      fontSize: 14,
      color: colors.textPrimary,
    },
    noBudgetBody: {
      fontFamily: fonts.body,
      fontSize: 13,
      color: colors.textMuted,
      marginTop: 4,
      lineHeight: 19,
    },
  });

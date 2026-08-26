import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { fonts, radii, spacing, ThemeColors } from "@/theme/theme";
import { useThemeStore } from "@/theme/useThemeStore";
import { Insight } from "@/services/fleetAnalytics";

/**
 * Real observations only — see fleetAnalytics.getFleetInsights, which
 * returns nothing rather than a fabricated stat when there isn't enough
 * data. `learning` distinguishes "no data yet" from "no notable pattern
 * this month," per the app's data-trust rule against implying more
 * confidence than the numbers support.
 */
export function FleetIntelligenceCard({ insights, learning }: { insights: Insight[]; learning: boolean }) {
  const colors = useThemeStore((s) => s.colors);
  const styles = makeStyles(colors);

  if (learning || insights.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.emptyTitle}>Fleet intelligence is learning</Text>
        <Text style={styles.emptyBody}>
          Add a few more fuel, service, or charging records and we'll start surfacing patterns
          across your household's vehicles.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {insights.map((insight, i) => (
        <View key={i} style={[styles.row, i > 0 && styles.rowDivider]}>
          <Ionicons name="sparkles-outline" size={16} color={colors.accent} style={styles.icon} />
          <Text style={styles.text}>{insight.text}</Text>
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
      alignItems: "flex-start",
      padding: spacing.md,
    },
    rowDivider: {
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.border,
    },
    icon: {
      marginRight: spacing.sm,
      marginTop: 2,
    },
    text: {
      flex: 1,
      fontFamily: fonts.body,
      fontSize: 13,
      lineHeight: 19,
      color: colors.textPrimary,
    },
    emptyTitle: {
      fontFamily: fonts.bodySemiBold,
      fontSize: 14,
      color: colors.textPrimary,
      padding: spacing.md,
      paddingBottom: 0,
    },
    emptyBody: {
      fontFamily: fonts.body,
      fontSize: 13,
      color: colors.textMuted,
      padding: spacing.md,
      lineHeight: 19,
    },
  });

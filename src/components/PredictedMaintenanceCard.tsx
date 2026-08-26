import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { fonts, radii, spacing, ThemeColors } from "@/theme/theme";
import { useThemeStore } from "@/theme/useThemeStore";
import { formatKm } from "@/utils/format";
import { MaintenancePrediction } from "@/services/maintenancePrediction";

/**
 * Pattern-based estimates from this vehicle's own service history —
 * explicitly labeled "Predicted" throughout and never merged with the
 * "Renewals & Maintenance" scheduled section, so a guess never reads as
 * manufacturer-required maintenance.
 */
export function PredictedMaintenanceCard({ predictions }: { predictions: MaintenancePrediction[] }) {
  const colors = useThemeStore((s) => s.colors);
  const styles = makeStyles(colors);

  if (predictions.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.emptyText}>
          Not enough repeated service history yet — log the same service type a few times and
          predictions will appear here.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {predictions.map((p, i) => {
        const overdueEstimate = p.kmRemaining < 0;
        return (
          <View key={p.type} style={[styles.row, i > 0 && styles.rowDivider]}>
            <View style={styles.rowContent}>
              <View style={styles.titleRow}>
                <Text style={styles.type}>{p.type}</Text>
                <View style={styles.badge}>
                  <Ionicons name="analytics-outline" size={11} color={colors.textMuted} />
                  <Text style={styles.badgeText}>Predicted</Text>
                </View>
              </View>
              <Text style={styles.meta}>
                Based on {p.intervalsUsed + 1} past services · ~{formatKm(p.avgIntervalKm)} apart
              </Text>
            </View>
            <Text style={[styles.kmValue, overdueEstimate && styles.kmValueWarning]}>
              {overdueEstimate
                ? `~${formatKm(Math.abs(p.kmRemaining))} past est.`
                : `~${formatKm(p.kmRemaining)} left`}
            </Text>
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
    rowContent: {
      flex: 1,
    },
    titleRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.xs,
    },
    type: {
      fontFamily: fonts.bodySemiBold,
      fontSize: 14,
      color: colors.textPrimary,
    },
    badge: {
      flexDirection: "row",
      alignItems: "center",
      gap: 3,
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: radii.sm,
      backgroundColor: colors.background,
    },
    badgeText: {
      fontFamily: fonts.body,
      fontSize: 10,
      color: colors.textMuted,
      textTransform: "uppercase",
      letterSpacing: 0.3,
    },
    meta: {
      fontFamily: fonts.body,
      fontSize: 12,
      color: colors.textMuted,
      marginTop: 3,
    },
    kmValue: {
      fontFamily: fonts.mono,
      fontSize: 13,
      color: colors.textPrimary,
      marginLeft: spacing.sm,
    },
    kmValueWarning: {
      color: colors.dueSoon,
    },
    emptyText: {
      fontFamily: fonts.body,
      fontSize: 13,
      color: colors.textMuted,
      padding: spacing.md,
      lineHeight: 19,
    },
  });

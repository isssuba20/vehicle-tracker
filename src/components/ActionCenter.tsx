import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { fonts, radii, spacing, ThemeColors, urgencyColor } from "@/theme/theme";
import { useThemeStore } from "@/theme/useThemeStore";
import { formatDate } from "@/utils/format";
import { ActionItem } from "@/services/fleetAnalytics";

/**
 * "What needs my attention right now" — aggregated overdue/due-soon items
 * across every household vehicle, so the user never has to open each
 * vehicle individually to find out. Only renders items that need action;
 * an empty list means the caller should show its own "all caught up" state.
 */
export function ActionCenter({
  items,
  onMarkDone,
}: {
  items: ActionItem[];
  onMarkDone: (item: ActionItem) => void;
}) {
  const colors = useThemeStore((s) => s.colors);
  const styles = makeStyles(colors);

  return (
    <View style={styles.container}>
      {items.map((item, i) => (
        <View key={`${item.vehicleId}-${item.kind}`} style={[styles.row, i > 0 && styles.rowDivider]}>
          <View style={[styles.bar, { backgroundColor: urgencyColor(item.urgency) }]} />
          <View style={styles.rowContent}>
            <Text style={styles.title}>
              {item.label} · {item.vehicleName}
            </Text>
            <Text style={styles.subtitle}>
              {item.urgency === "overdue" ? "Overdue since " : "Due "}
              {formatDate(item.dateLabel)}
            </Text>
          </View>
          <Pressable onPress={() => onMarkDone(item)} hitSlop={8}>
            <Text style={styles.action}>Mark done</Text>
          </Pressable>
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
      paddingVertical: spacing.sm + 2,
      paddingRight: spacing.md,
    },
    rowDivider: {
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.border,
    },
    bar: {
      width: 3,
      alignSelf: "stretch",
      marginRight: spacing.sm + 2,
    },
    rowContent: {
      flex: 1,
    },
    title: {
      fontFamily: fonts.bodySemiBold,
      fontSize: 14,
      color: colors.textPrimary,
    },
    subtitle: {
      fontFamily: fonts.mono,
      fontSize: 12,
      color: colors.textMuted,
      marginTop: 2,
    },
    action: {
      fontFamily: fonts.bodyMedium,
      fontSize: 12,
      color: colors.accent,
      marginLeft: spacing.sm,
    },
  });

import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { Urgency } from "@/types/models";
import { fonts, spacing, ThemeColors } from "@/theme/theme";
import { useThemeStore } from "@/theme/useThemeStore";
import { UrgencyBadge } from "./UrgencyBadge";

export function StatusRow({
  label,
  dateLabel,
  urgency,
  extraLabel,
  onMarkDone,
}: {
  label: string;
  dateLabel: string;
  urgency: Urgency;
  extraLabel?: string;
  onMarkDone?: () => void;
}) {
  const colors = useThemeStore((s) => s.colors);
  const styles = makeStyles(colors);

  return (
    <View style={styles.row}>
      <View style={{ flex: 1 }}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.date}>{dateLabel}</Text>
        {extraLabel ? <Text style={styles.extra}>{extraLabel}</Text> : null}
      </View>
      <View style={styles.rightCol}>
        <UrgencyBadge urgency={urgency} />
        {onMarkDone && (
          <Pressable onPress={onMarkDone} hitSlop={8}>
            <Text style={styles.markDone}>Mark done</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    row: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingVertical: spacing.sm,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
    },
    label: {
      fontFamily: fonts.bodySemiBold,
      fontSize: 15,
      color: colors.textPrimary,
    },
    date: {
      fontFamily: fonts.mono,
      fontSize: 13,
      color: colors.textMuted,
      marginTop: 2,
    },
    extra: {
      fontFamily: fonts.body,
      fontSize: 12,
      color: colors.textFaint,
      marginTop: 2,
    },
    rightCol: {
      alignItems: "flex-end",
      gap: 4,
    },
    markDone: {
      fontFamily: fonts.bodyMedium,
      fontSize: 12,
      color: colors.accent,
    },
  });

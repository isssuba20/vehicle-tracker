import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Urgency } from "@/types/models";
import { colors, fonts, spacing } from "@/theme/theme";
import { UrgencyBadge } from "./UrgencyBadge";

export function StatusRow({
  label,
  dateLabel,
  urgency,
  extraLabel,
}: {
  label: string;
  dateLabel: string;
  urgency: Urgency;
  extraLabel?: string;
}) {
  return (
    <View style={styles.row}>
      <View style={{ flex: 1 }}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.date}>{dateLabel}</Text>
        {extraLabel ? <Text style={styles.extra}>{extraLabel}</Text> : null}
      </View>
      <UrgencyBadge urgency={urgency} />
    </View>
  );
}

const styles = StyleSheet.create({
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
    color: colors.ink,
  },
  date: {
    fontFamily: fonts.mono,
    fontSize: 13,
    color: colors.inkMuted,
    marginTop: 2,
  },
  extra: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.inkFaint,
    marginTop: 2,
  },
});

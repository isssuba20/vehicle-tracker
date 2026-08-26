import React, { useState } from "react";
import { View, Text, Pressable, Platform, StyleSheet } from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { colors, fonts, radii, spacing } from "@/theme/theme";
import { formatDate } from "@/utils/format";

export function DateField({
  label,
  valueIso,
  onChange,
}: {
  label: string;
  valueIso: string;
  onChange: (iso: string) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <Pressable style={styles.input} onPress={() => setOpen(true)}>
        <Text style={styles.value}>{formatDate(valueIso)}</Text>
      </Pressable>
      {open && (
        <DateTimePicker
          value={new Date(valueIso)}
          mode="date"
          display={Platform.OS === "ios" ? "inline" : "default"}
          onChange={(_, date) => {
            setOpen(Platform.OS === "ios");
            if (date) onChange(date.toISOString().slice(0, 10));
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  },
  label: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.textMuted,
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
  },
  value: {
    fontFamily: fonts.mono,
    fontSize: 14,
    color: colors.textPrimary,
  },
});

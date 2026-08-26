import React from "react";
import { View, Text, TextInput, StyleSheet, TextInputProps } from "react-native";
import { fonts, radii, spacing, ThemeColors } from "@/theme/theme";
import { useThemeStore } from "@/theme/useThemeStore";

export function TextField({
  label,
  required,
  ...inputProps
}: { label: string; required?: boolean } & TextInputProps) {
  const colors = useThemeStore((s) => s.colors);
  const styles = makeStyles(colors);

  return (
    <View style={styles.container}>
      <Text style={styles.label}>
        {label}
        {required ? <Text style={styles.required}> *</Text> : null}
      </Text>
      <TextInput
        placeholderTextColor={colors.textFaint}
        style={styles.input}
        {...inputProps}
      />
    </View>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      marginBottom: spacing.md,
    },
    label: {
      fontFamily: fonts.body,
      fontSize: 12,
      color: colors.textMuted,
      marginBottom: 4,
    },
    required: {
      color: colors.overdueBright,
    },
    input: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radii.sm,
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.sm,
      backgroundColor: colors.surface,
      fontFamily: fonts.body,
      fontSize: 14,
      color: colors.textPrimary,
    },
  });

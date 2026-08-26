import React, { useState } from "react";
import { View, Text, TextInput, Pressable, StyleSheet, TextInputProps } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { fonts, radii, spacing, ThemeColors } from "@/theme/theme";
import { useThemeStore } from "@/theme/useThemeStore";

export function TextField({
  label,
  required,
  ...inputProps
}: { label: string; required?: boolean } & TextInputProps) {
  const colors = useThemeStore((s) => s.colors);
  const styles = makeStyles(colors);
  const isPassword = inputProps.secureTextEntry === true;
  const [revealed, setRevealed] = useState(false);

  return (
    <View style={styles.container}>
      <Text style={styles.label}>
        {label}
        {required ? <Text style={styles.required}> *</Text> : null}
      </Text>
      <View style={styles.inputRow}>
        <TextInput
          placeholderTextColor={colors.textFaint}
          style={[styles.input, isPassword && styles.inputWithIcon]}
          {...inputProps}
          secureTextEntry={isPassword ? !revealed : inputProps.secureTextEntry}
        />
        {isPassword && (
          <Pressable
            style={styles.revealButton}
            onPress={() => setRevealed((r) => !r)}
            hitSlop={8}
          >
            <Ionicons
              name={revealed ? "eye-off-outline" : "eye-outline"}
              size={18}
              color={colors.textFaint}
            />
          </Pressable>
        )}
      </View>
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
    inputRow: {
      position: "relative",
      justifyContent: "center",
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
    inputWithIcon: {
      paddingRight: spacing.xl,
    },
    revealButton: {
      position: "absolute",
      right: spacing.sm,
      padding: 4,
    },
  });

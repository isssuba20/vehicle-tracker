import React, { useState } from "react";
import { View, Text, Pressable, Modal, FlatList, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { fonts, radii, spacing, ThemeColors } from "@/theme/theme";
import { useThemeStore } from "@/theme/useThemeStore";
import { CURRENCY_OPTIONS, CurrencyCode } from "@/state/useCurrencyStore";

/**
 * A single compact row (like DateField) instead of an always-expanded
 * chip grid — the previous UI showed all 8 currencies at once and wrapped
 * onto multiple rows. Tapping opens a small picker sheet; the collapsed
 * state only ever takes one line.
 */
export function CurrencyPickerField({
  label,
  code,
  onChange,
}: {
  label: string;
  code: CurrencyCode;
  onChange: (code: CurrencyCode) => void;
}) {
  const [open, setOpen] = useState(false);
  const colors = useThemeStore((s) => s.colors);
  const insets = useSafeAreaInsets();
  const styles = makeStyles(colors);
  const selected = CURRENCY_OPTIONS.find((c) => c.code === code);

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <Pressable style={styles.input} onPress={() => setOpen(true)}>
        <Text style={styles.value}>
          {code} — {selected?.label}
        </Text>
        <Ionicons name="chevron-down" size={16} color={colors.textMuted} />
      </Pressable>

      <Modal visible={open} animationType="slide" transparent onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)} />
        <View style={[styles.sheet, { paddingBottom: spacing.md + insets.bottom }]}>
          <View style={styles.handle} />
          <Text style={styles.sheetTitle}>Currency</Text>
          <FlatList
            data={CURRENCY_OPTIONS}
            keyExtractor={(opt) => opt.code}
            renderItem={({ item }) => {
              const active = item.code === code;
              return (
                <Pressable
                  style={styles.option}
                  onPress={() => {
                    onChange(item.code);
                    setOpen(false);
                  }}
                >
                  <Text style={[styles.optionText, active && styles.optionTextActive]}>
                    {item.code} — {item.label}
                  </Text>
                  {active && <Ionicons name="checkmark" size={18} color={colors.accent} />}
                </Pressable>
              );
            }}
          />
        </View>
      </Modal>
    </View>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      marginBottom: spacing.sm,
    },
    label: {
      fontFamily: fonts.body,
      fontSize: 12,
      color: colors.textMuted,
      marginBottom: 4,
    },
    input: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
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
    backdrop: {
      flex: 1,
      backgroundColor: "rgba(34,38,43,0.4)",
    },
    sheet: {
      backgroundColor: colors.background,
      borderTopLeftRadius: radii.lg,
      borderTopRightRadius: radii.lg,
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.md,
      maxHeight: "70%",
    },
    handle: {
      width: 40,
      height: 4,
      borderRadius: 2,
      backgroundColor: colors.border,
      alignSelf: "center",
      marginBottom: spacing.md,
    },
    sheetTitle: {
      fontFamily: fonts.display,
      fontSize: 18,
      color: colors.textPrimary,
      marginBottom: spacing.sm,
    },
    option: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingVertical: spacing.sm + 2,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.border,
    },
    optionText: {
      fontFamily: fonts.body,
      fontSize: 15,
      color: colors.textPrimary,
    },
    optionTextActive: {
      fontFamily: fonts.bodySemiBold,
      color: colors.accent,
    },
  });

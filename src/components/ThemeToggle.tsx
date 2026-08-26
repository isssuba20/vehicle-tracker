import React from "react";
import { Pressable, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useThemeStore } from "@/theme/useThemeStore";
import { ThemeColors } from "@/theme/theme";

export function ThemeToggle({ colors }: { colors: ThemeColors }) {
  const mode = useThemeStore((s) => s.mode);
  const toggle = useThemeStore((s) => s.toggle);

  return (
    <Pressable
      onPress={toggle}
      hitSlop={8}
      style={[styles.button, { backgroundColor: colors.surface, borderColor: colors.border }]}
    >
      <Ionicons
        name={mode === "dark" ? "moon-outline" : "sunny-outline"}
        size={18}
        color={colors.accent}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});

import React, { useState } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Updates from "expo-updates";
import { Ionicons } from "@expo/vector-icons";
import { fonts, radii, spacing, ThemeColors } from "@/theme/theme";
import { useThemeStore } from "@/theme/useThemeStore";

/**
 * A dismissible strip at the top of the app, shown once a background
 * update check (useAppUpdateCheck) has already downloaded a new bundle.
 * Never restarts automatically — always asks first, so an update never
 * yanks the screen out from under whatever the user is doing.
 */
export function UpdateBanner({ visible }: { visible: boolean }) {
  const [dismissed, setDismissed] = useState(false);
  const [restarting, setRestarting] = useState(false);
  const colors = useThemeStore((s) => s.colors);
  const insets = useSafeAreaInsets();
  const styles = makeStyles(colors);

  if (!visible || dismissed) return null;

  return (
    <View
      style={[styles.container, { paddingTop: insets.top + spacing.xs }]}
      accessibilityRole="alert"
    >
      <Ionicons name="sparkles-outline" size={16} color={colors.onAccent} importantForAccessibility="no" />
      <Text style={styles.text}>An update is ready</Text>
      <Pressable
        style={styles.restartButton}
        disabled={restarting}
        onPress={() => {
          setRestarting(true);
          Updates.reloadAsync().catch(() => setRestarting(false));
        }}
        accessibilityRole="button"
        accessibilityLabel={restarting ? "Restarting" : "Restart app to apply update"}
      >
        <Text style={styles.restartText}>{restarting ? "Restarting…" : "Restart"}</Text>
      </Pressable>
      <Pressable
        style={styles.dismissButton}
        onPress={() => setDismissed(true)}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel="Dismiss update notification"
      >
        <Ionicons name="close" size={16} color={colors.onAccent} />
      </Pressable>
    </View>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.accent,
      paddingHorizontal: spacing.md,
      paddingBottom: spacing.xs + 2,
      gap: spacing.xs,
    },
    text: {
      flex: 1,
      fontFamily: fonts.bodyMedium,
      fontSize: 13,
      color: colors.onAccent,
    },
    restartButton: {
      paddingHorizontal: spacing.sm,
      paddingVertical: 4,
      borderRadius: radii.sm,
      backgroundColor: colors.onAccent,
    },
    restartText: {
      fontFamily: fonts.bodySemiBold,
      fontSize: 12,
      color: colors.accent,
    },
    dismissButton: {
      padding: 2,
    },
  });

import React, { useState } from "react";
import { View, Text, Pressable, StyleSheet, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView } from "react-native";
import { fonts, radii, spacing, ThemeColors } from "@/theme/theme";
import { useThemeStore } from "@/theme/useThemeStore";
import { useAppStore } from "@/state/store";
import { useAuthStore } from "@/state/authStore";
import { TextField } from "@/components/TextField";

export function OnboardingScreen() {
  const colors = useThemeStore((s) => s.colors);
  const styles = makeStyles(colors);
  const { createHousehold, joinHousehold } = useAppStore();
  const signOut = useAuthStore((s) => s.signOut);

  const [mode, setMode] = useState<"create" | "join">("create");
  const [displayName, setDisplayName] = useState("");
  const [householdName, setHouseholdName] = useState("");
  const [code, setCode] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    if (!displayName.trim()) {
      Alert.alert("Enter your name", "This is how other members will see you.");
      return;
    }
    if (mode === "create" && !householdName.trim()) {
      Alert.alert("Name your household", "e.g. \"Suba Household\"");
      return;
    }
    if (mode === "join" && !code.trim()) {
      Alert.alert("Enter an invite code", "Ask whoever invited you for their 6-character code.");
      return;
    }
    setSubmitting(true);
    try {
      if (mode === "create") {
        await createHousehold(householdName.trim(), displayName.trim());
      } else {
        await joinHousehold(code.trim(), displayName.trim());
      }
    } catch (err) {
      Alert.alert("Couldn't continue", err instanceof Error ? err.message : "Unknown error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Set up your household</Text>
        <Text style={styles.subtitle}>
          Vehicles belong to a household so everyone in it can track the same cars.
        </Text>

        <View style={styles.tabs}>
          <Pressable
            style={[styles.tab, mode === "create" && styles.tabActive]}
            onPress={() => setMode("create")}
          >
            <Text style={[styles.tabText, mode === "create" && styles.tabTextActive]}>
              Create new
            </Text>
          </Pressable>
          <Pressable
            style={[styles.tab, mode === "join" && styles.tabActive]}
            onPress={() => setMode("join")}
          >
            <Text style={[styles.tabText, mode === "join" && styles.tabTextActive]}>
              Join with code
            </Text>
          </Pressable>
        </View>

        <TextField
          label="Your name"
          value={displayName}
          onChangeText={setDisplayName}
          placeholder="How members will see you"
          required
        />

        {mode === "create" ? (
          <TextField
            label="Household name"
            value={householdName}
            onChangeText={setHouseholdName}
            placeholder="e.g. Suba Household"
            required
          />
        ) : (
          <TextField
            label="Invite code"
            value={code}
            onChangeText={setCode}
            placeholder="e.g. AB12CD"
            autoCapitalize="characters"
            required
          />
        )}

        <Pressable style={styles.primaryButton} onPress={handleSubmit} disabled={submitting}>
          {submitting ? (
            <ActivityIndicator color={colors.onAccent} />
          ) : (
            <Text style={styles.primaryButtonText}>
              {mode === "create" ? "Create household" : "Join household"}
            </Text>
          )}
        </Pressable>

        <Pressable style={styles.signOutButton} onPress={signOut}>
          <Text style={styles.signOutText}>Sign out</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    scroll: {
      flexGrow: 1,
      justifyContent: "center",
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.xl,
    },
    title: {
      fontFamily: fonts.display,
      fontSize: 22,
      color: colors.textPrimary,
      textAlign: "center",
      marginBottom: spacing.xs,
    },
    subtitle: {
      fontFamily: fonts.body,
      fontSize: 13,
      color: colors.textMuted,
      textAlign: "center",
      marginBottom: spacing.lg,
    },
    tabs: {
      flexDirection: "row",
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radii.md,
      marginBottom: spacing.lg,
      overflow: "hidden",
    },
    tab: {
      flex: 1,
      paddingVertical: spacing.sm,
      alignItems: "center",
    },
    tabActive: {
      backgroundColor: colors.surfaceElevated,
    },
    tabText: {
      fontFamily: fonts.bodyMedium,
      fontSize: 13,
      color: colors.textFaint,
    },
    tabTextActive: {
      color: colors.accent,
    },
    primaryButton: {
      backgroundColor: colors.accent,
      borderRadius: radii.md,
      paddingVertical: spacing.sm + 2,
      alignItems: "center",
      marginTop: spacing.sm,
    },
    primaryButtonText: {
      fontFamily: fonts.bodySemiBold,
      fontSize: 14,
      color: colors.onAccent,
    },
    signOutButton: {
      marginTop: spacing.lg,
      alignItems: "center",
    },
    signOutText: {
      fontFamily: fonts.bodyMedium,
      fontSize: 13,
      color: colors.textMuted,
    },
  });

import React, { useState } from "react";
import { View, Text, Pressable, StyleSheet, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView } from "react-native";
import { fonts, radii, spacing, ThemeColors } from "@/theme/theme";
import { useThemeStore } from "@/theme/useThemeStore";
import { useAuthStore } from "@/state/authStore";
import { TextField } from "@/components/TextField";

export function AuthScreen() {
  const colors = useThemeStore((s) => s.colors);
  const styles = makeStyles(colors);
  const { signIn, signUp } = useAuthStore();

  const [mode, setMode] = useState<"signIn" | "signUp">("signIn");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    if (!email.trim() || !password) {
      Alert.alert("Missing info", "Enter both an email and a password.");
      return;
    }
    setSubmitting(true);
    try {
      if (mode === "signIn") {
        await signIn(email.trim(), password);
      } else {
        await signUp(email.trim(), password);
        Alert.alert(
          "Check your email",
          "We sent a confirmation link — verify your address, then sign in."
        );
        setMode("signIn");
      }
    } catch (err) {
      Alert.alert("Couldn't sign you in", err instanceof Error ? err.message : "Unknown error");
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
        <Text style={styles.title}>Garahe</Text>
        <Text style={styles.subtitle}>
          {mode === "signIn" ? "Sign in to your household" : "Create your account"}
        </Text>

        <TextField
          label="Email"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          placeholder="you@example.com"
        />
        <TextField
          label="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          placeholder="••••••••"
        />

        <Pressable style={styles.primaryButton} onPress={handleSubmit} disabled={submitting}>
          {submitting ? (
            <ActivityIndicator color={colors.onAccent} />
          ) : (
            <Text style={styles.primaryButtonText}>
              {mode === "signIn" ? "Sign in" : "Sign up"}
            </Text>
          )}
        </Pressable>

        <Pressable
          style={styles.switchModeButton}
          onPress={() => setMode(mode === "signIn" ? "signUp" : "signIn")}
        >
          <Text style={styles.switchModeText}>
            {mode === "signIn" ? "New here? Create an account" : "Already have an account? Sign in"}
          </Text>
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
      fontSize: 28,
      color: colors.textPrimary,
      textAlign: "center",
      marginBottom: spacing.xs,
    },
    subtitle: {
      fontFamily: fonts.body,
      fontSize: 14,
      color: colors.textMuted,
      textAlign: "center",
      marginBottom: spacing.xl,
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
    switchModeButton: {
      marginTop: spacing.lg,
      alignItems: "center",
    },
    switchModeText: {
      fontFamily: fonts.bodyMedium,
      fontSize: 13,
      color: colors.accent,
    },
  });

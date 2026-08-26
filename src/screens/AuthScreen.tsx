import React, { useState } from "react";
import { View, Text, Pressable, StyleSheet, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView } from "react-native";
import { fonts, radii, spacing, ThemeColors } from "@/theme/theme";
import { useThemeStore } from "@/theme/useThemeStore";
import { useAuthStore } from "@/state/authStore";
import { TextField } from "@/components/TextField";
import { AnimatedPressable } from "@/components/AnimatedPressable";

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
          "We sent a confirmation link — tap it on this device to finish signing in."
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
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "android" ? 24 : 0}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Garahe</Text>
        <Text style={styles.tagline}>Household Fleet Tracker</Text>
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

        <AnimatedPressable style={styles.primaryButton} onPress={handleSubmit} disabled={submitting}>
          {submitting ? (
            <ActivityIndicator color={colors.onAccent} />
          ) : (
            <Text style={styles.primaryButtonText}>
              {mode === "signIn" ? "Sign in" : "Sign up"}
            </Text>
          )}
        </AnimatedPressable>

        <Pressable
          style={styles.switchModeButton}
          onPress={() => setMode(mode === "signIn" ? "signUp" : "signIn")}
        >
          <Text style={styles.switchModeText}>
            {mode === "signIn" ? "New here? Create an account" : "Already have an account? Sign in"}
          </Text>
        </Pressable>

        <Text style={styles.poweredBy}>Powered by BizVenMa</Text>
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
      fontSize: 34,
      letterSpacing: 0.5,
      color: colors.accent,
      textAlign: "center",
    },
    tagline: {
      fontFamily: fonts.bodyMedium,
      fontSize: 13,
      letterSpacing: 0.5,
      textTransform: "uppercase",
      color: colors.textMuted,
      textAlign: "center",
      marginTop: 4,
    },
    subtitle: {
      fontFamily: fonts.body,
      fontSize: 14,
      color: colors.textMuted,
      textAlign: "center",
      marginTop: spacing.lg,
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
    poweredBy: {
      fontFamily: fonts.body,
      fontSize: 11,
      color: colors.textFaint,
      textAlign: "center",
      marginTop: spacing.xl,
    },
  });

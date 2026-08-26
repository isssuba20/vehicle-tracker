import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, Pressable, StyleSheet, Alert } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Updates from "expo-updates";
import { useAppStore } from "@/state/store";
import { useAuthStore } from "@/state/authStore";
import { isSupabaseConfigured } from "@/data/supabase/client";
import { fonts, radii, spacing, ThemeColors } from "@/theme/theme";
import { useThemeStore } from "@/theme/useThemeStore";
import { CURRENCY_OPTIONS, useCurrencyStore } from "@/state/useCurrencyStore";
import { TextField } from "@/components/TextField";
import { ThemeToggle } from "@/components/ThemeToggle";

// The code box always sits on a solid `colors.ok` fill (locked, same
// in both themes), so its text needs a fixed bright color rather than
// colors.textPrimary, which flips to near-black in light mode.
const ON_OK_TEXT = "#F3EFE7";

function buildInfoLabel(): string {
  if (!Updates.isEnabled) return "Dev build (no OTA updates)";
  if (Updates.isEmbeddedLaunch) return "Running the version built into this install";
  const shortId = Updates.updateId ? Updates.updateId.slice(0, 8) : "unknown";
  const when = Updates.createdAt ? Updates.createdAt.toLocaleString() : "unknown time";
  return `Update ${shortId} · published ${when}`;
}

export function SettingsScreen() {
  const { groupIds, groups, members, loadMembers, inviteMember, updateHouseholdBudget, currentUserId } =
    useAppStore();
  const signOut = useAuthStore((s) => s.signOut);
  const currencyCode = useCurrencyStore((s) => s.code);
  const setCurrencyCode = useCurrencyStore((s) => s.setCode);
  const colors = useThemeStore((s) => s.colors);
  const styles = makeStyles(colors);
  const insets = useSafeAreaInsets();
  const groupId = groupIds[0];
  const household = groups.find((g) => g.id === groupId);
  const [inviteName, setInviteName] = useState("");
  const [lastCode, setLastCode] = useState<string | null>(null);
  const [checkingUpdate, setCheckingUpdate] = useState(false);
  const [budgetInput, setBudgetInput] = useState(household?.monthlyBudget != null ? String(household.monthlyBudget) : "");
  const [savingBudget, setSavingBudget] = useState(false);

  async function handleSaveBudget() {
    if (!groupId || savingBudget) return;
    const value = budgetInput.trim() ? Number(budgetInput) : undefined;
    if (budgetInput.trim() && (Number.isNaN(value) || (value as number) < 0)) {
      Alert.alert("Enter a valid amount", "Use a positive number, or leave it blank to remove the budget.");
      return;
    }
    setSavingBudget(true);
    try {
      await updateHouseholdBudget(groupId, value);
    } finally {
      setSavingBudget(false);
    }
  }

  async function handleCheckForUpdate() {
    if (!Updates.isEnabled) {
      Alert.alert("Dev build", "This install has no OTA updates channel — rebuild to get a new native binary.");
      return;
    }
    setCheckingUpdate(true);
    try {
      const check = await Updates.checkForUpdateAsync();
      if (!check.isAvailable) {
        Alert.alert("Up to date", "The update server has nothing newer than what's currently running.");
        return;
      }
      const fetched = await Updates.fetchUpdateAsync();
      if (fetched.isNew) {
        Alert.alert("Update downloaded", "Restarting to apply it now.", [
          { text: "OK", onPress: () => Updates.reloadAsync() },
        ]);
      } else {
        Alert.alert("Nothing to apply", "Checked, but no new bundle was fetched.");
      }
    } catch (err) {
      Alert.alert("Update check failed", err instanceof Error ? err.message : "Unknown error");
    } finally {
      setCheckingUpdate(false);
    }
  }

  useEffect(() => {
    if (groupId) loadMembers(groupId);
  }, [groupId]);

  useEffect(() => {
    setBudgetInput(household?.monthlyBudget != null ? String(household.monthlyBudget) : "");
  }, [household?.monthlyBudget]);

  async function handleInvite() {
    if (!groupId) return;
    if (!isSupabaseConfigured && !inviteName.trim()) {
      Alert.alert("Enter a name", "Give the person you're inviting a name so you can recognize them in the member list.");
      return;
    }
    const code = await inviteMember(groupId, inviteName.trim());
    setLastCode(code);
    setInviteName("");
  }

  return (
    <ScrollView
      style={[styles.container, { paddingTop: spacing.lg + insets.top }]}
      contentContainerStyle={{ paddingBottom: spacing.xl }}
    >
      <View style={styles.titleRow}>
        <Text style={styles.title}>Settings</Text>
        <ThemeToggle colors={colors} />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Household access</Text>
        <Text style={styles.sectionBody}>
          Everyone in this group can view all vehicles and log fuel or service entries.
        </Text>

        {members.map((item) => (
          <View key={item.userId} style={styles.memberRow}>
            <Text style={styles.memberName}>{item.displayName}</Text>
            <View style={styles.roleBadge}>
              <Text style={styles.roleText}>{item.role}</Text>
            </View>
          </View>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Currency</Text>
        <Text style={styles.sectionBody}>
          Used for purchase price, fuel, service, and charging costs across the app.
        </Text>
        <View style={styles.currencyGrid}>
          {CURRENCY_OPTIONS.map((opt) => {
            const active = opt.code === currencyCode;
            return (
              <Pressable
                key={opt.code}
                style={[styles.currencyChip, active && styles.currencyChipActive]}
                onPress={() => setCurrencyCode(opt.code)}
              >
                <Text style={[styles.currencyChipText, active && styles.currencyChipTextActive]}>
                  {opt.code}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Household budget</Text>
        <Text style={styles.sectionBody}>
          A monthly target for total vehicle spending, shown against actual spend on the dashboard.
        </Text>
        <TextField
          label={`Monthly budget (${currencyCode})`}
          placeholder="Leave blank for no budget"
          keyboardType="decimal-pad"
          value={budgetInput}
          onChangeText={setBudgetInput}
        />
        <Pressable style={styles.inviteButton} onPress={handleSaveBudget} disabled={savingBudget}>
          <Text style={styles.inviteButtonText}>{savingBudget ? "Saving…" : "Save budget"}</Text>
        </Pressable>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Invite a member</Text>
        <Text style={styles.sectionBody}>
          {isSupabaseConfigured
            ? "Generates a code that adds them to this household as soon as they sign up and enter it — send it to them yourself."
            : "There's no backend yet, so this generates a shareable code you can send them yourself. When a real invite system ships, this becomes a proper link."}
        </Text>
        {!isSupabaseConfigured && (
          <TextField
            label="Name"
            placeholder="Who are you inviting?"
            value={inviteName}
            onChangeText={setInviteName}
          />
        )}
        <Pressable style={styles.inviteButton} onPress={handleInvite}>
          <Text style={styles.inviteButtonText}>Generate invite code</Text>
        </Pressable>
        {lastCode && (
          <View style={styles.codeBox}>
            <Text style={styles.codeLabel}>Share this code</Text>
            <Text style={styles.code}>{lastCode}</Text>
          </View>
        )}
      </View>

      {isSupabaseConfigured && (
        <Pressable style={styles.signOutButton} onPress={signOut}>
          <Text style={styles.signOutText}>Sign out</Text>
        </Pressable>
      )}

      <Text style={styles.buildInfo}>{buildInfoLabel()}</Text>
      <Pressable
        style={styles.checkUpdateButton}
        onPress={handleCheckForUpdate}
        disabled={checkingUpdate}
      >
        <Text style={styles.checkUpdateText}>
          {checkingUpdate ? "Checking…" : "Check for updates"}
        </Text>
      </Pressable>
    </ScrollView>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
      paddingHorizontal: spacing.md,
    },
    titleRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: spacing.md,
    },
    title: {
      fontFamily: fonts.display,
      fontSize: 28,
      color: colors.textPrimary,
    },
    section: {
      backgroundColor: colors.surface,
      borderRadius: radii.lg,
      borderWidth: 1,
      borderColor: colors.border,
      padding: spacing.md,
      marginBottom: spacing.md,
    },
    sectionTitle: {
      fontFamily: fonts.display,
      fontSize: 16,
      color: colors.textPrimary,
      marginBottom: 4,
    },
    sectionBody: {
      fontFamily: fonts.body,
      fontSize: 13,
      color: colors.textMuted,
      marginBottom: spacing.sm,
    },
    memberRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingVertical: spacing.sm,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.border,
    },
    memberName: {
      fontFamily: fonts.bodyMedium,
      fontSize: 14,
      color: colors.textPrimary,
    },
    roleBadge: {
      backgroundColor: colors.surfaceElevated,
      borderRadius: radii.sm,
      paddingHorizontal: 10,
      paddingVertical: 3,
    },
    roleText: {
      fontFamily: fonts.body,
      fontSize: 11,
      color: colors.textMuted,
      textTransform: "capitalize",
    },
    currencyGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: spacing.sm,
    },
    currencyChip: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.xs + 2,
      borderRadius: radii.sm,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.background,
    },
    currencyChipActive: {
      backgroundColor: colors.accent,
      borderColor: colors.accent,
    },
    currencyChipText: {
      fontFamily: fonts.bodyMedium,
      fontSize: 13,
      color: colors.textMuted,
    },
    currencyChipTextActive: {
      color: colors.onAccent,
      fontFamily: fonts.bodySemiBold,
    },
    inviteButton: {
      backgroundColor: colors.accent,
      borderRadius: radii.md,
      paddingVertical: spacing.sm + 2,
      alignItems: "center",
    },
    inviteButtonText: {
      fontFamily: fonts.bodySemiBold,
      fontSize: 14,
      color: colors.onAccent,
    },
    codeBox: {
      marginTop: spacing.md,
      padding: spacing.md,
      backgroundColor: colors.ok,
      borderRadius: radii.md,
      alignItems: "center",
    },
    codeLabel: {
      fontFamily: fonts.body,
      fontSize: 12,
      color: ON_OK_TEXT,
    },
    code: {
      fontFamily: fonts.mono,
      fontSize: 24,
      letterSpacing: 4,
      color: ON_OK_TEXT,
      marginTop: 4,
    },
    signOutButton: {
      alignItems: "center",
      paddingVertical: spacing.sm,
    },
    signOutText: {
      fontFamily: fonts.bodyMedium,
      fontSize: 13,
      color: colors.overdueBright,
    },
    buildInfo: {
      fontFamily: fonts.mono,
      fontSize: 11,
      color: colors.textFaint,
      textAlign: "center",
      marginTop: spacing.sm,
      marginBottom: spacing.sm,
    },
    checkUpdateButton: {
      alignItems: "center",
      paddingVertical: spacing.sm,
      marginBottom: spacing.lg,
    },
    checkUpdateText: {
      fontFamily: fonts.bodyMedium,
      fontSize: 12,
      color: colors.accent,
    },
  });

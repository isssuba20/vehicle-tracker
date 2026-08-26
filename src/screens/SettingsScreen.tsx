import React, { useEffect, useState } from "react";
import { View, Text, FlatList, Pressable, StyleSheet, Alert } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Updates from "expo-updates";
import { useAppStore } from "@/state/store";
import { useAuthStore } from "@/state/authStore";
import { isSupabaseConfigured } from "@/data/supabase/client";
import { fonts, radii, spacing, ThemeColors } from "@/theme/theme";
import { useThemeStore } from "@/theme/useThemeStore";
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
  const { groupIds, members, loadMembers, inviteMember, currentUserId } = useAppStore();
  const signOut = useAuthStore((s) => s.signOut);
  const colors = useThemeStore((s) => s.colors);
  const styles = makeStyles(colors);
  const insets = useSafeAreaInsets();
  const groupId = groupIds[0];
  const [inviteName, setInviteName] = useState("");
  const [lastCode, setLastCode] = useState<string | null>(null);

  useEffect(() => {
    if (groupId) loadMembers(groupId);
  }, [groupId]);

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
    <View style={[styles.container, { paddingTop: spacing.lg + insets.top }]}>
      <View style={styles.titleRow}>
        <Text style={styles.title}>Settings</Text>
        <ThemeToggle colors={colors} />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Household access</Text>
        <Text style={styles.sectionBody}>
          Everyone in this group can view all vehicles and log fuel or service entries.
        </Text>

        <FlatList
          data={members}
          keyExtractor={(m) => m.userId}
          renderItem={({ item }) => (
            <View style={styles.memberRow}>
              <Text style={styles.memberName}>{item.displayName}</Text>
              <View style={styles.roleBadge}>
                <Text style={styles.roleText}>{item.role}</Text>
              </View>
            </View>
          )}
        />
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
    </View>
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
      marginBottom: spacing.lg,
    },
  });

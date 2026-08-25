import React, { useEffect, useState } from "react";
import { View, Text, FlatList, Pressable, StyleSheet, Alert } from "react-native";
import { useAppStore } from "@/state/store";
import { colors, fonts, radii, spacing } from "@/theme/theme";
import { TextField } from "@/components/TextField";

export function SettingsScreen() {
  const { groupIds, members, loadMembers, inviteMember, currentUserId } = useAppStore();
  const groupId = groupIds[0];
  const [inviteName, setInviteName] = useState("");
  const [lastCode, setLastCode] = useState<string | null>(null);

  useEffect(() => {
    if (groupId) loadMembers(groupId);
  }, [groupId]);

  async function handleInvite() {
    if (!groupId) return;
    if (!inviteName.trim()) {
      Alert.alert("Enter a name", "Give the person you're inviting a name so you can recognize them in the member list.");
      return;
    }
    const code = await inviteMember(groupId, inviteName.trim());
    setLastCode(code);
    setInviteName("");
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Settings</Text>

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
          There's no backend yet, so this generates a shareable code you can send
          them yourself. When a real invite system ships, this becomes a proper link.
        </Text>
        <TextField
          label="Name"
          placeholder="Who are you inviting?"
          value={inviteName}
          onChangeText={setInviteName}
        />
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.paper,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.lg,
  },
  title: {
    fontFamily: fonts.display,
    fontSize: 28,
    color: colors.ink,
    marginBottom: spacing.md,
  },
  section: {
    backgroundColor: colors.paperRaised,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontFamily: fonts.display,
    fontSize: 16,
    color: colors.ink,
    marginBottom: 4,
  },
  sectionBody: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.inkMuted,
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
    color: colors.ink,
  },
  roleBadge: {
    backgroundColor: colors.paper,
    borderRadius: radii.pill,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  roleText: {
    fontFamily: fonts.body,
    fontSize: 11,
    color: colors.inkMuted,
    textTransform: "capitalize",
  },
  inviteButton: {
    backgroundColor: colors.ink,
    borderRadius: radii.md,
    paddingVertical: spacing.sm + 2,
    alignItems: "center",
  },
  inviteButtonText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 14,
    color: colors.paper,
  },
  codeBox: {
    marginTop: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.okBg,
    borderRadius: radii.md,
    alignItems: "center",
  },
  codeLabel: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.inkMuted,
  },
  code: {
    fontFamily: fonts.mono,
    fontSize: 24,
    letterSpacing: 4,
    color: colors.ok,
    marginTop: 4,
  },
});

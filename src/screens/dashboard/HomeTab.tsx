import React from "react";
import { ScrollView, Text, View, Pressable, RefreshControl, StyleSheet } from "react-native";
import { CompositeNavigationProp } from "@react-navigation/native";
import { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { TabParamList, RootStackParamList } from "@/navigation/types";
import { ActionCenter } from "@/components/ActionCenter";
import { AnimatedPressable } from "@/components/AnimatedPressable";
import { fonts, radii, spacing, ThemeColors } from "@/theme/theme";
import { useThemeStore } from "@/theme/useThemeStore";
import { ActionItem } from "@/services/fleetAnalytics";

type DashboardNav = CompositeNavigationProp<
  BottomTabNavigationProp<TabParamList, "Dashboard">,
  NativeStackNavigationProp<RootStackParamList>
>;

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

/**
 * What needs attention right now — overdue and near-due (within the
 * usual 30-day/500km "due soon" window) items only. The fleet list
 * itself lives on the Fleet tab; this tab stays reserved for
 * attention-worthy items so it never grows past what's actually urgent.
 */
export function HomeTab({
  navigation,
  hasVehicles,
  actionItems,
  currentMemberName,
  onMarkDone,
  refreshing,
  onRefresh,
}: {
  navigation: DashboardNav;
  hasVehicles: boolean;
  actionItems: ActionItem[];
  currentMemberName: string | undefined;
  onMarkDone: (item: ActionItem) => void;
  refreshing: boolean;
  onRefresh: () => void;
}) {
  const colors = useThemeStore((s) => s.colors);
  const styles = makeStyles(colors);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingTop: spacing.md, paddingBottom: spacing.xl }}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />}
    >
      <Text style={styles.greeting}>
        {greeting()}
        {currentMemberName ? `, ${currentMemberName}` : ""}
      </Text>
      <Text style={styles.greetingSub}>
        {!hasVehicles
          ? "Add your first vehicle to get started"
          : actionItems.length === 0
          ? "Your household is all caught up"
          : `${actionItems.length} thing${actionItems.length === 1 ? "" : "s"} need${
              actionItems.length === 1 ? "s" : ""
            } your attention`}
      </Text>

      {!hasVehicles ? (
        <View style={styles.onboarding}>
          <Text style={styles.onboardingText}>
            Once you add a vehicle, registration, insurance, and service renewals that are overdue or coming
            up will show here first.
          </Text>
          <AnimatedPressable
            style={styles.onboardingButton}
            onPress={() => navigation.navigate("AddEditVehicle", {})}
          >
            <Text style={styles.onboardingButtonText}>+ Add your first vehicle</Text>
          </AnimatedPressable>
        </View>
      ) : actionItems.length > 0 ? (
        <View style={styles.section}>
          <ActionCenter items={actionItems} onMarkDone={onMarkDone} />
        </View>
      ) : (
        <View style={styles.caughtUp}>
          <Text style={styles.caughtUpText}>
            No overdue or upcoming renewals right now — check back here whenever something needs a look.
          </Text>
        </View>
      )}
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
    greeting: {
      fontFamily: fonts.display,
      fontSize: 24,
      color: colors.textPrimary,
    },
    greetingSub: {
      fontFamily: fonts.body,
      fontSize: 13,
      color: colors.textMuted,
      marginTop: 2,
    },
    section: {
      marginTop: spacing.lg,
    },
    caughtUp: {
      marginTop: spacing.xl,
      alignItems: "center",
      paddingHorizontal: spacing.lg,
    },
    caughtUpText: {
      fontFamily: fonts.body,
      fontSize: 14,
      color: colors.textMuted,
      textAlign: "center",
    },
    onboarding: {
      marginTop: spacing.xl,
      alignItems: "center",
      paddingHorizontal: spacing.lg,
    },
    onboardingText: {
      fontFamily: fonts.body,
      fontSize: 14,
      color: colors.textMuted,
      textAlign: "center",
      marginBottom: spacing.lg,
    },
    onboardingButton: {
      backgroundColor: colors.accent,
      borderRadius: radii.lg,
      paddingVertical: spacing.sm + 2,
      paddingHorizontal: spacing.lg,
      alignItems: "center",
    },
    onboardingButtonText: {
      fontFamily: fonts.bodySemiBold,
      fontSize: 15,
      color: colors.onAccent,
    },
  });

import React from "react";
import { View, Text, FlatList, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { CompositeNavigationProp } from "@react-navigation/native";
import { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { TabParamList, RootStackParamList } from "@/navigation/types";
import { Vehicle } from "@/types/models";
import { VehicleCard } from "@/components/VehicleCard";
import { AnimatedPressable } from "@/components/AnimatedPressable";
import { ActionCenter } from "@/components/ActionCenter";
import { fonts, radii, spacing, ThemeColors } from "@/theme/theme";
import { useThemeStore } from "@/theme/useThemeStore";
import { EfficiencyDisplay } from "@/utils/vehicleEfficiencyDisplay";
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

/** The day-to-day tab: what needs attention right now, and the fleet itself. */
export function HomeTab({
  navigation,
  vehicles,
  actionItems,
  efficiencyByVehicle,
  memberNameById,
  currentMemberName,
  updateVehicle,
  onMarkDone,
}: {
  navigation: DashboardNav;
  vehicles: Vehicle[];
  actionItems: ActionItem[];
  efficiencyByVehicle: Record<string, EfficiencyDisplay>;
  memberNameById: Record<string, string>;
  currentMemberName: string | undefined;
  updateVehicle: (v: Vehicle) => void;
  onMarkDone: (item: ActionItem) => void;
}) {
  const colors = useThemeStore((s) => s.colors);
  const styles = makeStyles(colors);
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      <FlatList
        data={vehicles}
        keyExtractor={(v) => v.id}
        contentContainerStyle={{ paddingTop: spacing.md, paddingBottom: spacing.xl * 3 }}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <>
            <Text style={styles.greeting}>
              {greeting()}
              {currentMemberName ? `, ${currentMemberName}` : ""}
            </Text>
            <Text style={styles.greetingSub}>
              {actionItems.length === 0
                ? "Your household is all caught up"
                : `${actionItems.length} thing${actionItems.length === 1 ? "" : "s"} need${
                    actionItems.length === 1 ? "s" : ""
                  } your attention`}
            </Text>

            {actionItems.length > 0 && (
              <View style={styles.section}>
                <ActionCenter items={actionItems} onMarkDone={onMarkDone} />
              </View>
            )}

            {vehicles.length > 0 && <Text style={styles.sectionTitle}>Your fleet</Text>}
          </>
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>No vehicles yet</Text>
            <Text style={styles.emptyBody}>
              Add your first vehicle to start tracking service, fuel, and renewals.
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <VehicleCard
            vehicle={item}
            efficiency={
              efficiencyByVehicle[item.id] ?? { label: "Fuel efficiency", text: "—", implausible: false }
            }
            driverName={item.primaryDriverUserId ? memberNameById[item.primaryDriverUserId] : undefined}
            onPress={() => navigation.navigate("VehicleDetail", { vehicleId: item.id })}
            onPhotoChange={(photoUri) => updateVehicle({ ...item, photoUri })}
          />
        )}
      />
      <AnimatedPressable
        style={[styles.addButton, { bottom: spacing.md + insets.bottom }]}
        onPress={() => navigation.navigate("AddEditVehicle", {})}
      >
        <Text style={styles.addButtonText}>+ Add a vehicle</Text>
      </AnimatedPressable>
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
    sectionTitle: {
      fontFamily: fonts.body,
      fontSize: 12,
      textTransform: "uppercase",
      letterSpacing: 0.5,
      color: colors.textFaint,
      marginBottom: spacing.sm,
      marginTop: spacing.lg,
    },
    empty: {
      paddingVertical: spacing.xl,
      alignItems: "center",
    },
    emptyTitle: {
      fontFamily: fonts.bodySemiBold,
      fontSize: 16,
      color: colors.textPrimary,
      marginBottom: spacing.xs,
    },
    emptyBody: {
      fontFamily: fonts.body,
      fontSize: 14,
      color: colors.textMuted,
      textAlign: "center",
      paddingHorizontal: spacing.lg,
    },
    addButton: {
      position: "absolute",
      left: spacing.md,
      right: spacing.md,
      backgroundColor: colors.accent,
      borderRadius: radii.lg,
      paddingVertical: spacing.md,
      alignItems: "center",
    },
    addButtonText: {
      fontFamily: fonts.bodySemiBold,
      fontSize: 16,
      color: colors.onAccent,
    },
  });

import React from "react";
import { View, Text, FlatList, RefreshControl, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { CompositeNavigationProp } from "@react-navigation/native";
import { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { TabParamList, RootStackParamList } from "@/navigation/types";
import { Vehicle } from "@/types/models";
import { VehicleCard } from "@/components/VehicleCard";
import { AnimatedPressable } from "@/components/AnimatedPressable";
import { fonts, radii, spacing, ThemeColors } from "@/theme/theme";
import { useThemeStore } from "@/theme/useThemeStore";
import { EfficiencyDisplay } from "@/utils/vehicleEfficiencyDisplay";

type DashboardNav = CompositeNavigationProp<
  BottomTabNavigationProp<TabParamList, "Dashboard">,
  NativeStackNavigationProp<RootStackParamList>
>;

/** The household's vehicles — separate from Home, which is only ever what needs attention. */
export function FleetTab({
  navigation,
  vehicles,
  efficiencyByVehicle,
  memberNameById,
  updateVehicle,
  refreshing,
  onRefresh,
}: {
  navigation: DashboardNav;
  vehicles: Vehicle[];
  efficiencyByVehicle: Record<string, EfficiencyDisplay>;
  memberNameById: Record<string, string>;
  updateVehicle: (v: Vehicle) => void;
  refreshing: boolean;
  onRefresh: () => void;
}) {
  const colors = useThemeStore((s) => s.colors);
  const styles = makeStyles(colors);
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      <FlatList
        data={vehicles}
        keyExtractor={(v) => v.id}
        style={styles.list}
        contentContainerStyle={{ paddingTop: spacing.md, paddingBottom: spacing.md }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />
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
      <View style={[styles.footer, { paddingBottom: spacing.md + insets.bottom }]}>
        <AnimatedPressable style={styles.addButton} onPress={() => navigation.navigate("AddEditVehicle", {})}>
          <Text style={styles.addButtonText}>+ Add a vehicle</Text>
        </AnimatedPressable>
      </View>
    </View>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    list: {
      paddingHorizontal: spacing.md,
    },
    footer: {
      paddingHorizontal: spacing.md,
      paddingTop: spacing.sm,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.border,
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

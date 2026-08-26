import React, { useEffect, useMemo } from "react";
import { View, Text, FlatList, Pressable, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { TabScreenProps } from "@/navigation/types";
import { useAppStore } from "@/state/store";
import { VehicleCard } from "@/components/VehicleCard";
import { ThemeToggle } from "@/components/ThemeToggle";
import { fonts, radii, spacing, ThemeColors } from "@/theme/theme";
import { useThemeStore } from "@/theme/useThemeStore";
import { getEfficiencyDisplay, EfficiencyDisplay } from "@/utils/vehicleEfficiencyDisplay";

type Props = TabScreenProps<"Dashboard">;

export function DashboardScreen({ navigation }: Props) {
  const { ready, vehicles, fuelByVehicle, chargingByVehicle, loadVehicleDetail, updateVehicle } =
    useAppStore();
  const colors = useThemeStore((s) => s.colors);
  const styles = makeStyles(colors);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    // Prime fuel/charging history for each vehicle so the dashboard can
    // show last-known efficiency without waiting for the detail screen.
    vehicles.forEach((v) => loadVehicleDetail(v.id));
  }, [vehicles.length]);

  const efficiencyByVehicle = useMemo(() => {
    const map: Record<string, EfficiencyDisplay> = {};
    for (const v of vehicles) {
      map[v.id] = getEfficiencyDisplay(v, fuelByVehicle[v.id] ?? [], chargingByVehicle[v.id] ?? []);
    }
    return map;
  }, [vehicles, fuelByVehicle, chargingByVehicle]);

  if (!ready) {
    return (
      <View style={styles.center}>
        <Text style={styles.loadingText}>Loading your garage…</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: spacing.lg + insets.top }]}>
      <View style={styles.titleRow}>
        <Text style={styles.title}>My Vehicles</Text>
        <ThemeToggle colors={colors} />
      </View>
      <FlatList
        data={vehicles}
        keyExtractor={(v) => v.id}
        contentContainerStyle={{ paddingBottom: spacing.xl * 2 }}
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
            onPress={() => navigation.navigate("VehicleDetail", { vehicleId: item.id })}
            onPhotoChange={(photoUri) => updateVehicle({ ...item, photoUri })}
          />
        )}
      />
      <Pressable
        style={[styles.addButton, { bottom: spacing.md + insets.bottom }]}
        onPress={() => navigation.navigate("AddEditVehicle", {})}
      >
        <Text style={styles.addButtonText}>+ Add a vehicle</Text>
      </Pressable>
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
    center: {
      flex: 1,
      backgroundColor: colors.background,
      alignItems: "center",
      justifyContent: "center",
    },
    loadingText: {
      fontFamily: fonts.body,
      color: colors.textMuted,
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

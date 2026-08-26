import React, { useEffect, useMemo } from "react";
import { View, Text, FlatList, Pressable, StyleSheet } from "react-native";
import { TabScreenProps } from "@/navigation/types";
import { useAppStore } from "@/state/store";
import { VehicleCard } from "@/components/VehicleCard";
import { colors, fonts, radii, spacing } from "@/theme/theme";
import { latestKmPerLiter, LatestEfficiency } from "@/utils/fuelEfficiency";

type Props = TabScreenProps<"Dashboard">;

export function DashboardScreen({ navigation }: Props) {
  const { ready, vehicles, init, fuelByVehicle, loadVehicleDetail } = useAppStore();

  useEffect(() => {
    init();
  }, []);

  useEffect(() => {
    // Prime fuel history for each vehicle so the dashboard can show
    // last-known km/L without waiting for the detail screen.
    vehicles.forEach((v) => loadVehicleDetail(v.id));
  }, [vehicles.length]);

  const kmPerLiterByVehicle = useMemo(() => {
    const map: Record<string, LatestEfficiency> = {};
    for (const v of vehicles) {
      map[v.id] = latestKmPerLiter(fuelByVehicle[v.id] ?? []);
    }
    return map;
  }, [vehicles, fuelByVehicle]);

  if (!ready) {
    return (
      <View style={styles.center}>
        <Text style={styles.loadingText}>Loading your garage…</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>My Vehicles</Text>
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
            efficiency={kmPerLiterByVehicle[item.id] ?? { kmPerLiter: null, implausible: false }}
            onPress={() => navigation.navigate("VehicleDetail", { vehicleId: item.id })}
          />
        )}
      />
      <Pressable
        style={styles.addButton}
        onPress={() => navigation.navigate("AddEditVehicle", {})}
      >
        <Text style={styles.addButtonText}>+ Add a vehicle</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.lg,
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
  title: {
    fontFamily: fonts.display,
    fontSize: 28,
    color: colors.textPrimary,
    marginBottom: spacing.md,
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
    bottom: spacing.lg,
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

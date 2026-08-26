import React, { useEffect, useMemo, useState } from "react";
import { View, Text, FlatList, Pressable, StyleSheet } from "react-native";
import { useVehicle } from "./VehicleContext";
import { useAppStore } from "@/state/store";
import { colors, fonts, radii, spacing } from "@/theme/theme";
import { formatDate, formatKm, formatKmPerLiter, formatPeso } from "@/utils/format";
import { withComputedEfficiency } from "@/utils/fuelEfficiency";
import { QuickAddSheet } from "./QuickAddSheet";

export function FuelTab() {
  const vehicle = useVehicle();
  const { fuelByVehicle, loadVehicleDetail } = useAppStore();
  const [sheetOpen, setSheetOpen] = useState(false);

  useEffect(() => {
    loadVehicleDetail(vehicle.id);
  }, [vehicle.id]);

  const entries = useMemo(
    () => withComputedEfficiency(fuelByVehicle[vehicle.id] ?? []),
    [fuelByVehicle, vehicle.id]
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={entries}
        keyExtractor={(e) => e.id}
        contentContainerStyle={{ padding: spacing.md, paddingBottom: spacing.xl * 3 }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>No fuel logs yet</Text>
            <Text style={styles.emptyBody}>
              Log a fill-up to start tracking fuel efficiency.
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={styles.date}>{formatDate(item.date)}</Text>
              <Text style={styles.meta}>
                {item.liters.toFixed(1)} L · {formatKm(item.odometerKm)}
              </Text>
            </View>
            <View style={styles.rightCol}>
              <Text style={styles.cost}>{formatPeso(item.cost)}</Text>
              <Text style={[styles.efficiency, item.implausible && styles.efficiencyWarning]}>
                {formatKmPerLiter(item.kmPerLiter, item.implausible)}
              </Text>
            </View>
          </View>
        )}
      />
      <Pressable style={styles.addButton} onPress={() => setSheetOpen(true)}>
        <Text style={styles.addButtonText}>+ Log fuel</Text>
      </Pressable>
      <QuickAddSheet kind="fuel" visible={sheetOpen} onClose={() => setSheetOpen(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  row: {
    flexDirection: "row",
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  date: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 14,
    color: colors.textPrimary,
  },
  meta: {
    fontFamily: fonts.mono,
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  rightCol: {
    alignItems: "flex-end",
  },
  cost: {
    fontFamily: fonts.mono,
    fontSize: 14,
    color: colors.textPrimary,
  },
  efficiency: {
    fontFamily: fonts.mono,
    fontSize: 12,
    color: colors.okBright,
    marginTop: 2,
  },
  efficiencyWarning: {
    color: colors.overdueBright,
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

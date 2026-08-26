import React, { useEffect, useMemo, useState } from "react";
import { View, Text, FlatList, Pressable, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useVehicle } from "./VehicleContext";
import { useAppStore } from "@/state/store";
import { fonts, radii, spacing, ThemeColors } from "@/theme/theme";
import { useThemeStore } from "@/theme/useThemeStore";
import { formatDate, formatKm, formatKmPerKwh, formatPeso } from "@/utils/format";
import { withComputedChargingEfficiency } from "@/utils/chargingEfficiency";
import { QuickAddSheet } from "./QuickAddSheet";

export function ChargingTab() {
  const vehicle = useVehicle();
  const { chargingByVehicle, loadVehicleDetail } = useAppStore();
  const [sheetOpen, setSheetOpen] = useState(false);
  const insets = useSafeAreaInsets();
  const colors = useThemeStore((s) => s.colors);
  const styles = makeStyles(colors);

  useEffect(() => {
    loadVehicleDetail(vehicle.id);
  }, [vehicle.id]);

  const entries = useMemo(
    () => withComputedChargingEfficiency(chargingByVehicle[vehicle.id] ?? []),
    [chargingByVehicle, vehicle.id]
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={entries}
        keyExtractor={(e) => e.id}
        contentContainerStyle={{ padding: spacing.md, paddingBottom: spacing.xl * 3 }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>No charging logs yet</Text>
            <Text style={styles.emptyBody}>
              Log a charge to start tracking charging efficiency.
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={styles.date}>{formatDate(item.date)}</Text>
              <Text style={styles.meta}>
                {item.kwh.toFixed(1)} kWh · {formatKm(item.odometerKm)}
              </Text>
            </View>
            <View style={styles.rightCol}>
              <Text style={styles.cost}>{formatPeso(item.cost)}</Text>
              <Text style={[styles.efficiency, item.implausible && styles.efficiencyWarning]}>
                {formatKmPerKwh(item.kmPerKwh, item.implausible)}
              </Text>
            </View>
          </View>
        )}
      />
      <Pressable
        style={[styles.addButton, { bottom: spacing.md + insets.bottom }]}
        onPress={() => setSheetOpen(true)}
      >
        <Text style={styles.addButtonText}>+ Log a charge</Text>
      </Pressable>
      <QuickAddSheet kind="charging" visible={sheetOpen} onClose={() => setSheetOpen(false)} />
    </View>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
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

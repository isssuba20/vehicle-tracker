import React, { useEffect, useMemo, useState } from "react";
import { View, Text, FlatList, Pressable, StyleSheet, Alert } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useVehicle } from "./VehicleContext";
import { useAppStore } from "@/state/store";
import { fonts, radii, spacing, ThemeColors } from "@/theme/theme";
import { useThemeStore } from "@/theme/useThemeStore";
import { useCurrencyStore } from "@/state/useCurrencyStore";
import { formatDate, formatKm, formatKmPerLiter, formatMoney } from "@/utils/format";
import { withComputedEfficiency } from "@/utils/fuelEfficiency";
import { QuickAddSheet } from "./QuickAddSheet";
import { AnimatedPressable } from "@/components/AnimatedPressable";
import { FuelLogEntry } from "@/types/models";

export function FuelTab() {
  const vehicle = useVehicle();
  const { fuelByVehicle, loadVehicleDetail, deleteFuelEntry } = useAppStore();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<FuelLogEntry | undefined>(undefined);
  const [duplicateEntry, setDuplicateEntry] = useState<FuelLogEntry | undefined>(undefined);
  const insets = useSafeAreaInsets();
  const colors = useThemeStore((s) => s.colors);
  const currencyCode = useCurrencyStore((s) => s.code);
  const styles = makeStyles(colors);

  useEffect(() => {
    loadVehicleDetail(vehicle.id);
  }, [vehicle.id]);

  const entries = useMemo(
    () => withComputedEfficiency(fuelByVehicle[vehicle.id] ?? []),
    [fuelByVehicle, vehicle.id]
  );

  function openAdd() {
    setEditingEntry(undefined);
    setDuplicateEntry(undefined);
    setSheetOpen(true);
  }

  function openEdit(entry: FuelLogEntry) {
    setEditingEntry(entry);
    setDuplicateEntry(undefined);
    setSheetOpen(true);
  }

  function openDuplicate(entry: FuelLogEntry) {
    setEditingEntry(undefined);
    setDuplicateEntry(entry);
    setSheetOpen(true);
  }

  function handleDelete(entry: FuelLogEntry) {
    Alert.alert("Delete this fuel log?", "This can't be undone.", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => deleteFuelEntry(entry.id, vehicle.id) },
    ]);
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={entries}
        keyExtractor={(e) => e.id}
        contentContainerStyle={{ padding: spacing.md, paddingBottom: spacing.md }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>No fuel logs yet</Text>
            <Text style={styles.emptyBody}>
              Log a fill-up to start tracking fuel efficiency.
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <Pressable style={styles.row} onPress={() => openEdit(item)}>
            <View style={{ flex: 1 }}>
              <Text style={styles.date}>{formatDate(item.date)}</Text>
              <Text style={styles.meta}>
                {item.liters.toFixed(1)} L · {formatKm(item.odometerKm)}
              </Text>
            </View>
            <View style={styles.rightCol}>
              <Text style={styles.cost}>{formatMoney(item.cost, currencyCode)}</Text>
              <Text style={[styles.efficiency, item.implausible && styles.efficiencyWarning]}>
                {formatKmPerLiter(item.kmPerLiter, item.implausible)}
              </Text>
            </View>
            <Pressable
              style={styles.deleteIcon}
              onPress={() => openDuplicate(item)}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel={`Duplicate fuel entry from ${formatDate(item.date)}`}
            >
              <Ionicons name="copy-outline" size={16} color={colors.textFaint} />
            </Pressable>
            <Pressable
              style={styles.deleteIcon}
              onPress={() => handleDelete(item)}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel={`Delete fuel entry from ${formatDate(item.date)}`}
            >
              <Ionicons name="trash-outline" size={16} color={colors.textFaint} />
            </Pressable>
          </Pressable>
        )}
      />
      <View style={[styles.footer, { paddingBottom: spacing.md + insets.bottom }]}>
        <AnimatedPressable style={styles.addButton} onPress={openAdd}>
          <Text style={styles.addButtonText}>+ Log fuel</Text>
        </AnimatedPressable>
      </View>
      <QuickAddSheet
        kind="fuel"
        visible={sheetOpen}
        entry={editingEntry}
        duplicateFrom={duplicateEntry}
        onClose={() => setSheetOpen(false)}
      />
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
      alignItems: "flex-start",
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
      marginRight: spacing.sm,
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
    deleteIcon: {
      padding: 4,
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
    footer: {
      paddingHorizontal: spacing.md,
      paddingTop: spacing.sm,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.border,
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

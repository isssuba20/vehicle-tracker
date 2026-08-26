import React, { useEffect, useState } from "react";
import { View, Text, FlatList, Pressable, StyleSheet, Alert } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useVehicle } from "./VehicleContext";
import { useAppStore } from "@/state/store";
import { fonts, radii, spacing, ThemeColors } from "@/theme/theme";
import { useThemeStore } from "@/theme/useThemeStore";
import { useCurrencyStore } from "@/state/useCurrencyStore";
import { formatDate, formatKm, formatMoney } from "@/utils/format";
import { QuickAddSheet } from "./QuickAddSheet";
import { AnimatedPressable } from "@/components/AnimatedPressable";
import { ServiceLogEntry } from "@/types/models";

export function ServiceTab() {
  const vehicle = useVehicle();
  const { serviceByVehicle, loadVehicleDetail, deleteServiceEntry } = useAppStore();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<ServiceLogEntry | undefined>(undefined);
  const insets = useSafeAreaInsets();
  const colors = useThemeStore((s) => s.colors);
  const currencyCode = useCurrencyStore((s) => s.code);
  const styles = makeStyles(colors);

  useEffect(() => {
    loadVehicleDetail(vehicle.id);
  }, [vehicle.id]);

  const entries = serviceByVehicle[vehicle.id] ?? [];

  function openAdd() {
    setEditingEntry(undefined);
    setSheetOpen(true);
  }

  function openEdit(entry: ServiceLogEntry) {
    setEditingEntry(entry);
    setSheetOpen(true);
  }

  function handleDelete(entry: ServiceLogEntry) {
    Alert.alert("Delete this service entry?", "This can't be undone.", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => deleteServiceEntry(entry.id, vehicle.id) },
    ]);
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={entries}
        keyExtractor={(e) => e.id}
        contentContainerStyle={{ padding: spacing.md, paddingBottom: spacing.xl * 3 }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>No service history yet</Text>
            <Text style={styles.emptyBody}>
              Log a service to start building this vehicle's maintenance record.
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <Pressable style={styles.row} onPress={() => openEdit(item)}>
            <View style={styles.rowTop}>
              <Text style={styles.type}>{item.type}</Text>
              <View style={styles.rowTopRight}>
                <Text style={styles.cost}>{formatMoney(item.cost, currencyCode)}</Text>
                <Pressable style={styles.deleteIcon} onPress={() => handleDelete(item)} hitSlop={8}>
                  <Ionicons name="trash-outline" size={16} color={colors.textFaint} />
                </Pressable>
              </View>
            </View>
            <Text style={styles.meta}>
              {formatDate(item.date)} · {formatKm(item.odometerKm)}
              {item.shop ? ` · ${item.shop}` : ""}
            </Text>
            {item.notes ? <Text style={styles.notes}>{item.notes}</Text> : null}
          </Pressable>
        )}
      />
      <AnimatedPressable
        style={[styles.addButton, { bottom: spacing.md + insets.bottom }]}
        onPress={openAdd}
      >
        <Text style={styles.addButtonText}>+ Log a service</Text>
      </AnimatedPressable>
      <QuickAddSheet
        kind="service"
        visible={sheetOpen}
        entry={editingEntry}
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
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  rowTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  rowTopRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  deleteIcon: {
    padding: 4,
  },
  type: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 15,
    color: colors.textPrimary,
  },
  cost: {
    fontFamily: fonts.mono,
    fontSize: 14,
    color: colors.textPrimary,
  },
  meta: {
    fontFamily: fonts.mono,
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 4,
  },
  notes: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 6,
    fontStyle: "italic",
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

import React, { useEffect, useState } from "react";
import { View, Text, FlatList, Pressable, StyleSheet } from "react-native";
import { useVehicle } from "./VehicleContext";
import { useAppStore } from "@/state/store";
import { colors, fonts, radii, spacing } from "@/theme/theme";
import { formatDate, formatKm, formatPeso } from "@/utils/format";
import { QuickAddSheet } from "./QuickAddSheet";

export function ServiceTab() {
  const vehicle = useVehicle();
  const { serviceByVehicle, loadVehicleDetail } = useAppStore();
  const [sheetOpen, setSheetOpen] = useState(false);

  useEffect(() => {
    loadVehicleDetail(vehicle.id);
  }, [vehicle.id]);

  const entries = serviceByVehicle[vehicle.id] ?? [];

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
          <View style={styles.row}>
            <View style={styles.rowTop}>
              <Text style={styles.type}>{item.type}</Text>
              <Text style={styles.cost}>{formatPeso(item.cost)}</Text>
            </View>
            <Text style={styles.meta}>
              {formatDate(item.date)} · {formatKm(item.odometerKm)}
              {item.shop ? ` · ${item.shop}` : ""}
            </Text>
            {item.notes ? <Text style={styles.notes}>{item.notes}</Text> : null}
          </View>
        )}
      />
      <Pressable style={styles.addButton} onPress={() => setSheetOpen(true)}>
        <Text style={styles.addButtonText}>+ Log a service</Text>
      </Pressable>
      <QuickAddSheet kind="service" visible={sheetOpen} onClose={() => setSheetOpen(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.paper,
  },
  row: {
    backgroundColor: colors.paperRaised,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  rowTop: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  type: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 15,
    color: colors.ink,
  },
  cost: {
    fontFamily: fonts.mono,
    fontSize: 14,
    color: colors.ink,
  },
  meta: {
    fontFamily: fonts.mono,
    fontSize: 12,
    color: colors.inkMuted,
    marginTop: 4,
  },
  notes: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.inkMuted,
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
    color: colors.ink,
    marginBottom: spacing.xs,
  },
  emptyBody: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.inkMuted,
    textAlign: "center",
  },
  addButton: {
    position: "absolute",
    bottom: spacing.lg,
    left: spacing.md,
    right: spacing.md,
    backgroundColor: colors.ink,
    borderRadius: radii.lg,
    paddingVertical: spacing.md,
    alignItems: "center",
  },
  addButtonText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 16,
    color: colors.paper,
  },
});

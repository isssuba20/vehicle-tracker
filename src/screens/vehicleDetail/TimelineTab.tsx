import React, { useEffect, useMemo } from "react";
import { View, Text, ScrollView, StyleSheet } from "react-native";
import { useVehicle } from "./VehicleContext";
import { useAppStore } from "@/state/store";
import { useCurrencyStore } from "@/state/useCurrencyStore";
import { fonts, radii, spacing, ThemeColors } from "@/theme/theme";
import { useThemeStore } from "@/theme/useThemeStore";
import { formatDate, formatKm, formatMoney } from "@/utils/format";
import { getVehicleTimeline } from "@/services/ownershipTimeline";

export function TimelineTab() {
  const vehicle = useVehicle();
  const { fuelByVehicle, serviceByVehicle, chargingByVehicle, loadVehicleDetail } = useAppStore();
  const currencyCode = useCurrencyStore((s) => s.code);
  const colors = useThemeStore((s) => s.colors);
  const styles = makeStyles(colors);

  useEffect(() => {
    loadVehicleDetail(vehicle.id);
  }, [vehicle.id]);

  const groups = useMemo(
    () =>
      getVehicleTimeline(
        vehicle,
        serviceByVehicle[vehicle.id] ?? [],
        fuelByVehicle[vehicle.id] ?? [],
        chargingByVehicle[vehicle.id] ?? []
      ),
    [vehicle, serviceByVehicle, fuelByVehicle, chargingByVehicle]
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: spacing.md, paddingBottom: spacing.xl }}>
      {groups.map((group, gi) => (
        <View key={group.year} style={styles.yearBlock}>
          <View style={styles.yearHeader}>
            <Text style={styles.year}>{group.year}</Text>
            {group.milestoneKm != null && (
              <Text style={styles.milestone}>{formatKm(group.milestoneKm)}</Text>
            )}
          </View>
          <View style={styles.rail}>
            {group.events.map((event, i) => (
              <View key={event.id} style={styles.eventRow}>
                <View style={styles.dotColumn}>
                  <View style={styles.dot} />
                  {(i < group.events.length - 1 || gi < groups.length - 1) && <View style={styles.line} />}
                </View>
                <View style={styles.eventContent}>
                  <Text style={styles.eventTitle}>{event.title}</Text>
                  <Text style={styles.eventMeta}>
                    {formatDate(event.date)}
                    {event.cost != null ? ` · ${formatMoney(event.cost, currencyCode)}` : ""}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    yearBlock: {
      marginBottom: spacing.lg,
    },
    yearHeader: {
      flexDirection: "row",
      alignItems: "baseline",
      justifyContent: "space-between",
      marginBottom: spacing.sm,
    },
    year: {
      fontFamily: fonts.display,
      fontSize: 20,
      color: colors.textPrimary,
    },
    milestone: {
      fontFamily: fonts.mono,
      fontSize: 13,
      color: colors.textMuted,
    },
    rail: {},
    eventRow: {
      flexDirection: "row",
    },
    dotColumn: {
      alignItems: "center",
      width: 16,
    },
    dot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: colors.accent,
      marginTop: 5,
    },
    line: {
      flex: 1,
      width: 1,
      backgroundColor: colors.border,
      marginTop: 2,
    },
    eventContent: {
      flex: 1,
      paddingBottom: spacing.md,
      paddingLeft: spacing.sm,
    },
    eventTitle: {
      fontFamily: fonts.bodySemiBold,
      fontSize: 14,
      color: colors.textPrimary,
    },
    eventMeta: {
      fontFamily: fonts.mono,
      fontSize: 12,
      color: colors.textMuted,
      marginTop: 2,
    },
  });

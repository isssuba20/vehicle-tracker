import React, { useEffect, useMemo, useState } from "react";
import { View, Text, ScrollView, StyleSheet, Pressable } from "react-native";
import { useVehicle } from "./VehicleContext";
import { useAppStore } from "@/state/store";
import { fonts, radii, spacing, ThemeColors } from "@/theme/theme";
import { useThemeStore } from "@/theme/useThemeStore";
import { useCurrencyStore } from "@/state/useCurrencyStore";
import { PredictedMaintenanceCard } from "@/components/PredictedMaintenanceCard";
import { getMaintenancePredictions } from "@/services/maintenancePrediction";
import { OwnershipCostCard } from "@/components/OwnershipCostCard";
import { SpendByCategoryChart } from "@/components/charts/SpendByCategoryChart";
import { getAllExpenses, getSpendByCategory } from "@/services/fleetAnalytics";
import { getVehicleOwnershipCost } from "@/services/ownershipCost";
import { TripCostSheet } from "./TripCostSheet";

/**
 * Predictive/derived views, kept separate from Overview so a vehicle's
 * plain facts (renewals, odometer, details) aren't crowded by things
 * that are computed and can be wrong or absent — insights, estimates,
 * a calculator. Nothing on this tab is stored; it's all read from
 * existing service/fuel/charging entries at render time.
 */
export function InsightsTab() {
  const vehicle = useVehicle();
  const { fuelByVehicle, chargingByVehicle, serviceByVehicle, loadVehicleDetail } = useAppStore();
  const colors = useThemeStore((s) => s.colors);
  const currencyCode = useCurrencyStore((s) => s.code);
  const styles = makeStyles(colors);
  const [tripCostVisible, setTripCostVisible] = useState(false);

  useEffect(() => {
    loadVehicleDetail(vehicle.id);
  }, [vehicle.id]);

  const serviceEntries = serviceByVehicle[vehicle.id] ?? [];
  const predictions = useMemo(
    () => getMaintenancePredictions(serviceEntries, vehicle.currentOdometerKm),
    [serviceEntries, vehicle.currentOdometerKm]
  );

  const expenses = useMemo(
    () =>
      getAllExpenses(
        [vehicle],
        { [vehicle.id]: fuelByVehicle[vehicle.id] ?? [] },
        { [vehicle.id]: serviceEntries },
        { [vehicle.id]: chargingByVehicle[vehicle.id] ?? [] }
      ),
    [vehicle, fuelByVehicle, serviceEntries, chargingByVehicle]
  );

  const ownershipCost = useMemo(() => getVehicleOwnershipCost(vehicle, expenses), [vehicle, expenses]);
  const categoryTotals = useMemo(() => getSpendByCategory(expenses), [expenses]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: spacing.xl }}>
      {tripCostVisible && (
        <TripCostSheet
          visible={tripCostVisible}
          vehicle={vehicle}
          fuelEntries={fuelByVehicle[vehicle.id] ?? []}
          chargingEntries={chargingByVehicle[vehicle.id] ?? []}
          onClose={() => setTripCostVisible(false)}
        />
      )}

      <View style={[styles.section, styles.firstSection]}>
        <Text style={styles.sectionTitle}>Predicted maintenance</Text>
        <PredictedMaintenanceCard predictions={predictions} />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Ownership cost</Text>
        <OwnershipCostCard cost={ownershipCost} currencyCode={currencyCode} />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Where it goes</Text>
        <SpendByCategoryChart totals={categoryTotals} currencyCode={currencyCode} />
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Trip cost</Text>
          <Pressable onPress={() => setTripCostVisible(true)} hitSlop={8}>
            <Text style={styles.link}>Calculate a trip →</Text>
          </Pressable>
        </View>
        <Text style={styles.hintText}>
          Estimate the fuel/energy cost of a specific trip using this vehicle's most recent logged
          efficiency and price.
        </Text>
      </View>
    </ScrollView>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
      paddingHorizontal: spacing.md,
    },
    section: {
      marginTop: spacing.lg,
    },
    firstSection: {
      marginTop: spacing.md,
    },
    sectionHeaderRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: spacing.sm,
    },
    sectionTitle: {
      fontFamily: fonts.display,
      fontSize: 16,
      color: colors.textPrimary,
    },
    link: {
      fontFamily: fonts.bodySemiBold,
      fontSize: 12,
      color: colors.accent,
    },
    hintText: {
      fontFamily: fonts.body,
      fontSize: 13,
      color: colors.textMuted,
    },
  });

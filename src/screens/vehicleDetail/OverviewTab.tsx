import React, { useEffect, useMemo, useState } from "react";
import { View, Text, ScrollView, StyleSheet, Pressable } from "react-native";
import { useVehicle } from "./VehicleContext";
import { useAppStore } from "@/state/store";
import { fonts, radii, spacing, ThemeColors } from "@/theme/theme";
import { useThemeStore } from "@/theme/useThemeStore";
import { dateUrgency, pmsUrgency } from "@/utils/urgency";
import { formatDate, formatKm, formatMoney } from "@/utils/format";
import { StatusRow } from "@/components/StatusRow";
import { getEfficiencyDisplay } from "@/utils/vehicleEfficiencyDisplay";
import { useCurrencyStore } from "@/state/useCurrencyStore";
import { MarkDoneSheet, RenewalKind } from "./MarkDoneSheet";
import { PredictedMaintenanceCard } from "@/components/PredictedMaintenanceCard";
import { getMaintenancePredictions } from "@/services/maintenancePrediction";
import { OwnershipCostCard } from "@/components/OwnershipCostCard";
import { getAllExpenses } from "@/services/fleetAnalytics";
import { getVehicleOwnershipCost } from "@/services/ownershipCost";
import { TripCostSheet } from "./TripCostSheet";

export function OverviewTab() {
  const vehicle = useVehicle();
  const { fuelByVehicle, chargingByVehicle, serviceByVehicle, loadVehicleDetail } = useAppStore();
  const colors = useThemeStore((s) => s.colors);
  const currencyCode = useCurrencyStore((s) => s.code);
  const styles = makeStyles(colors);
  const [markDoneKind, setMarkDoneKind] = useState<RenewalKind | null>(null);
  const [tripCostVisible, setTripCostVisible] = useState(false);

  useEffect(() => {
    loadVehicleDetail(vehicle.id);
  }, [vehicle.id]);

  const registration = dateUrgency(vehicle.registrationExpiry);
  const insurance = dateUrgency(vehicle.insuranceExpiry);
  const pms = pmsUrgency(vehicle.nextPmsDueDate, vehicle.nextPmsDueKm, vehicle.currentOdometerKm);

  const isHybridOrElectric = vehicle.fuelType !== "gas";

  const efficiency = useMemo(
    () => getEfficiencyDisplay(vehicle, fuelByVehicle[vehicle.id] ?? [], chargingByVehicle[vehicle.id] ?? []),
    [vehicle, fuelByVehicle, chargingByVehicle]
  );

  const pmsExtra = vehicle.nextPmsDueKm
    ? `or ${formatKm(vehicle.nextPmsDueKm)}, whichever comes first`
    : undefined;

  const serviceEntries = serviceByVehicle[vehicle.id] ?? [];
  const predictions = useMemo(
    () => getMaintenancePredictions(serviceEntries, vehicle.currentOdometerKm),
    [serviceEntries, vehicle.currentOdometerKm]
  );

  const ownershipCost = useMemo(() => {
    const expenses = getAllExpenses(
      [vehicle],
      { [vehicle.id]: fuelByVehicle[vehicle.id] ?? [] },
      { [vehicle.id]: serviceEntries },
      { [vehicle.id]: chargingByVehicle[vehicle.id] ?? [] }
    );
    return getVehicleOwnershipCost(vehicle, expenses);
  }, [vehicle, fuelByVehicle, serviceEntries, chargingByVehicle]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: spacing.xl }}>
      <View style={styles.plainSection}>
        <Text style={styles.sectionTitle}>Renewals & Maintenance</Text>
        <StatusRow
          label="Registration"
          dateLabel={formatDate(vehicle.registrationExpiry)}
          urgency={registration}
          onMarkDone={() => setMarkDoneKind("registration")}
        />
        <StatusRow
          label="Insurance"
          dateLabel={formatDate(vehicle.insuranceExpiry)}
          urgency={insurance}
          onMarkDone={() => setMarkDoneKind("insurance")}
        />
        <StatusRow
          label="Next PMS"
          dateLabel={formatDate(vehicle.nextPmsDueDate)}
          urgency={pms}
          extraLabel={pmsExtra}
          onMarkDone={() => setMarkDoneKind("pms")}
        />
      </View>

      {markDoneKind && (
        <MarkDoneSheet
          kind={markDoneKind}
          visible={!!markDoneKind}
          vehicle={vehicle}
          onClose={() => setMarkDoneKind(null)}
        />
      )}

      {tripCostVisible && (
        <TripCostSheet
          visible={tripCostVisible}
          vehicle={vehicle}
          fuelEntries={fuelByVehicle[vehicle.id] ?? []}
          chargingEntries={chargingByVehicle[vehicle.id] ?? []}
          onClose={() => setTripCostVisible(false)}
        />
      )}

      {serviceEntries.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Predicted maintenance</Text>
          <PredictedMaintenanceCard predictions={predictions} />
        </View>
      )}

      <View style={styles.card}>
        <View style={styles.cardHeaderRow}>
          <Text style={styles.sectionTitle}>At a glance</Text>
          <Pressable onPress={() => setTripCostVisible(true)} hitSlop={8}>
            <Text style={styles.tripCostLink}>Trip cost calculator</Text>
          </Pressable>
        </View>
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Odometer</Text>
            <Text style={styles.statValue}>{formatKm(vehicle.currentOdometerKm)}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>{efficiency.label}</Text>
            <Text style={[styles.statValue, efficiency.implausible && styles.statValueWarning]}>
              {efficiency.text}
            </Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Purchased</Text>
            <Text style={styles.statValue}>{formatDate(vehicle.purchaseDate)}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Purchase price</Text>
            <Text style={styles.statValue}>{formatMoney(vehicle.purchasePrice, currencyCode)}</Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Ownership cost</Text>
        <OwnershipCostCard cost={ownershipCost} currencyCode={currencyCode} />
      </View>

      <View style={styles.plainSection}>
        <Text style={styles.sectionTitle}>Details</Text>
        <DetailLine styles={styles} label="Plate number" value={vehicle.plateNumber} />
        <DetailLine styles={styles} label="VIN" value={vehicle.vin} />
        <DetailLine styles={styles} label="Color" value={vehicle.color} />
      </View>

      {isHybridOrElectric && (
        <View style={styles.plainSection}>
          <Text style={styles.sectionTitle}>EV details</Text>
          {vehicle.batteryCapacityKwh != null && (
            <DetailLine styles={styles} label="Battery capacity" value={`${vehicle.batteryCapacityKwh} kWh`} />
          )}
          {vehicle.estimatedRangeKm != null && (
            <DetailLine styles={styles} label="Estimated range" value={formatKm(vehicle.estimatedRangeKm)} />
          )}
          {vehicle.chargingPortType && (
            <DetailLine styles={styles} label="Charging port" value={vehicle.chargingPortType} />
          )}
          {vehicle.homeChargingNotes && (
            <View style={styles.notesBlock}>
              <Text style={styles.detailLabel}>Home charging</Text>
              <Text style={styles.notesText}>{vehicle.homeChargingNotes}</Text>
            </View>
          )}
          {vehicle.batteryCapacityKwh == null &&
            vehicle.estimatedRangeKm == null &&
            !vehicle.chargingPortType &&
            !vehicle.homeChargingNotes && (
              <Text style={styles.emptyDetails}>No EV details added yet — edit this vehicle to fill them in.</Text>
            )}
        </View>
      )}
    </ScrollView>
  );
}

function DetailLine({
  styles,
  label,
  value,
}: {
  styles: ReturnType<typeof makeStyles>;
  label: string;
  value: string;
}) {
  return (
    <View style={styles.detailLine}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
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
    section: {
      marginTop: spacing.lg,
    },
    card: {
      marginTop: spacing.lg,
      backgroundColor: colors.surface,
      borderRadius: radii.lg,
      borderWidth: 1,
      borderColor: colors.border,
      padding: spacing.md,
    },
    plainSection: {
      marginTop: spacing.lg,
      paddingTop: spacing.md,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.border,
    },
    sectionTitle: {
      fontFamily: fonts.display,
      fontSize: 16,
      color: colors.textPrimary,
      marginBottom: spacing.sm,
    },
    cardHeaderRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: spacing.sm,
    },
    tripCostLink: {
      fontFamily: fonts.bodySemiBold,
      fontSize: 12,
      color: colors.accent,
    },
    statsGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: spacing.md,
    },
    statCard: {
      width: "45%",
    },
    statLabel: {
      fontFamily: fonts.body,
      fontSize: 11,
      color: colors.textFaint,
      textTransform: "uppercase",
      letterSpacing: 0.5,
    },
    statValue: {
      fontFamily: fonts.mono,
      fontSize: 16,
      color: colors.textPrimary,
      marginTop: 2,
    },
    statValueWarning: {
      color: colors.overdueBright,
      fontSize: 13,
    },
    detailLine: {
      flexDirection: "row",
      justifyContent: "space-between",
      paddingVertical: spacing.xs,
    },
    detailLabel: {
      fontFamily: fonts.body,
      fontSize: 14,
      color: colors.textMuted,
    },
    detailValue: {
      fontFamily: fonts.mono,
      fontSize: 14,
      color: colors.textPrimary,
    },
    notesBlock: {
      paddingTop: spacing.sm,
    },
    notesText: {
      fontFamily: fonts.body,
      fontSize: 14,
      color: colors.textPrimary,
      marginTop: 2,
    },
    emptyDetails: {
      fontFamily: fonts.body,
      fontSize: 13,
      color: colors.textMuted,
      fontStyle: "italic",
    },
  });

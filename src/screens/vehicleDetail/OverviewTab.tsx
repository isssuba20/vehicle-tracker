import React, { useEffect, useMemo } from "react";
import { View, Text, ScrollView, StyleSheet } from "react-native";
import { useVehicle } from "./VehicleContext";
import { useAppStore } from "@/state/store";
import { fonts, radii, spacing, ThemeColors } from "@/theme/theme";
import { useThemeStore } from "@/theme/useThemeStore";
import { dateUrgency, pmsUrgency } from "@/utils/urgency";
import { formatDate, formatKm, formatPeso } from "@/utils/format";
import { StatusRow } from "@/components/StatusRow";
import { getEfficiencyDisplay } from "@/utils/vehicleEfficiencyDisplay";

export function OverviewTab() {
  const vehicle = useVehicle();
  const { fuelByVehicle, chargingByVehicle, loadVehicleDetail } = useAppStore();
  const colors = useThemeStore((s) => s.colors);
  const styles = makeStyles(colors);

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

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: spacing.xl }}>
      <View style={styles.plainSection}>
        <Text style={styles.sectionTitle}>Renewals & Maintenance</Text>
        <StatusRow label="Registration" dateLabel={formatDate(vehicle.registrationExpiry)} urgency={registration} />
        <StatusRow label="Insurance" dateLabel={formatDate(vehicle.insuranceExpiry)} urgency={insurance} />
        <StatusRow
          label="Next PMS"
          dateLabel={formatDate(vehicle.nextPmsDueDate)}
          urgency={pms}
          extraLabel={pmsExtra}
        />
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>At a glance</Text>
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
            <Text style={styles.statValue}>{formatPeso(vehicle.purchasePrice)}</Text>
          </View>
        </View>
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

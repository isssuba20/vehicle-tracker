import React, { useEffect, useMemo, useState } from "react";
import { View, Text, ScrollView, StyleSheet } from "react-native";
import { useVehicle } from "./VehicleContext";
import { useAppStore } from "@/state/store";
import { fonts, radii, spacing, ThemeColors } from "@/theme/theme";
import { useThemeStore } from "@/theme/useThemeStore";
import { dateUrgency, pmsUrgency } from "@/utils/urgency";
import { formatDate, formatKm, formatMoney } from "@/utils/format";
import { StatusRow } from "@/components/StatusRow";
import { getEfficiencyDisplay } from "@/utils/vehicleEfficiencyDisplay";
import { useCurrencyStore } from "@/state/useCurrencyStore";
import { useReminderSettingsStore } from "@/state/useReminderSettingsStore";
import { MarkDoneSheet, RenewalKind } from "./MarkDoneSheet";

export function OverviewTab() {
  const vehicle = useVehicle();
  const { fuelByVehicle, chargingByVehicle, loadVehicleDetail } = useAppStore();
  const colors = useThemeStore((s) => s.colors);
  const currencyCode = useCurrencyStore((s) => s.code);
  const dueSoonDays = useReminderSettingsStore((s) => s.dueSoonDays);
  const dueSoonKm = useReminderSettingsStore((s) => s.dueSoonKm);
  const styles = makeStyles(colors);
  const [markDoneKind, setMarkDoneKind] = useState<RenewalKind | null>(null);

  useEffect(() => {
    loadVehicleDetail(vehicle.id);
  }, [vehicle.id]);

  const registration = dateUrgency(vehicle.registrationExpiry, dueSoonDays);
  const insurance = dateUrgency(vehicle.insuranceExpiry, dueSoonDays);
  const pms = pmsUrgency(vehicle.nextPmsDueDate, vehicle.nextPmsDueKm, vehicle.currentOdometerKm, dueSoonDays, dueSoonKm);

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
      <View style={[styles.plainSection, styles.firstSection]}>
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
            <Text style={styles.statValue}>{formatMoney(vehicle.purchasePrice, currencyCode)}</Text>
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
    firstSection: {
      marginTop: spacing.md,
      paddingTop: 0,
      borderTopWidth: 0,
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

import React, { useEffect, useMemo } from "react";
import { View, Text, ScrollView, StyleSheet } from "react-native";
import { useVehicle } from "./VehicleContext";
import { useAppStore } from "@/state/store";
import { colors, fonts, radii, spacing } from "@/theme/theme";
import { dateUrgency, pmsUrgency } from "@/utils/urgency";
import { formatDate, formatKm, formatKmPerLiter, formatPeso } from "@/utils/format";
import { StatusRow } from "@/components/StatusRow";
import { latestKmPerLiter } from "@/utils/fuelEfficiency";

export function OverviewTab() {
  const vehicle = useVehicle();
  const { fuelByVehicle, loadVehicleDetail } = useAppStore();

  useEffect(() => {
    loadVehicleDetail(vehicle.id);
  }, [vehicle.id]);

  const registration = dateUrgency(vehicle.registrationExpiry);
  const insurance = dateUrgency(vehicle.insuranceExpiry);
  const pms = pmsUrgency(vehicle.nextPmsDueDate, vehicle.nextPmsDueKm, vehicle.currentOdometerKm);

  const efficiency = useMemo(
    () => latestKmPerLiter(fuelByVehicle[vehicle.id] ?? []),
    [fuelByVehicle, vehicle.id]
  );

  const pmsExtra = vehicle.nextPmsDueKm
    ? `or ${formatKm(vehicle.nextPmsDueKm)}, whichever comes first`
    : undefined;

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: spacing.xl }}>
      <View style={styles.section}>
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

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>At a glance</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Odometer</Text>
            <Text style={styles.statValue}>{formatKm(vehicle.currentOdometerKm)}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Fuel efficiency</Text>
            <Text style={styles.statValue}>{formatKmPerLiter(efficiency)}</Text>
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

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Details</Text>
        <DetailLine label="Plate number" value={vehicle.plateNumber} />
        <DetailLine label="VIN" value={vehicle.vin} />
        <DetailLine label="Color" value={vehicle.color} />
      </View>
    </ScrollView>
  );
}

function DetailLine({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detailLine}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.paper,
    paddingHorizontal: spacing.md,
  },
  section: {
    marginTop: spacing.lg,
    backgroundColor: colors.paperRaised,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  sectionTitle: {
    fontFamily: fonts.display,
    fontSize: 16,
    color: colors.ink,
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
    color: colors.inkFaint,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  statValue: {
    fontFamily: fonts.mono,
    fontSize: 16,
    color: colors.ink,
    marginTop: 2,
  },
  detailLine: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: spacing.xs,
  },
  detailLabel: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.inkMuted,
  },
  detailValue: {
    fontFamily: fonts.mono,
    fontSize: 14,
    color: colors.ink,
  },
});

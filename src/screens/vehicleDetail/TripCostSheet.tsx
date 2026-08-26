import React, { useMemo, useState } from "react";
import { Modal, View, Text, Pressable, ScrollView, StyleSheet, KeyboardAvoidingView, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { fonts, radii, spacing, ThemeColors } from "@/theme/theme";
import { useThemeStore } from "@/theme/useThemeStore";
import { useCurrencyStore } from "@/state/useCurrencyStore";
import { TextField } from "@/components/TextField";
import { Vehicle, FuelLogEntry, ChargingLogEntry } from "@/types/models";
import { computeTripCost } from "@/services/tripCost";
import { formatMoney } from "@/utils/format";

export function TripCostSheet({
  visible,
  vehicle,
  fuelEntries,
  chargingEntries,
  onClose,
}: {
  visible: boolean;
  vehicle: Vehicle;
  fuelEntries: FuelLogEntry[];
  chargingEntries: ChargingLogEntry[];
  onClose: () => void;
}) {
  const colors = useThemeStore((s) => s.colors);
  const currencyCode = useCurrencyStore((s) => s.code);
  const insets = useSafeAreaInsets();
  const styles = makeStyles(colors);

  const [distance, setDistance] = useState("");
  const [extras, setExtras] = useState("");

  const distanceKm = Number(distance) || 0;
  const extraCosts = Number(extras) || 0;

  const result = useMemo(
    () => computeTripCost(vehicle, fuelEntries, chargingEntries, distanceKm, extraCosts),
    [vehicle, fuelEntries, chargingEntries, distanceKm, extraCosts]
  );

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "android" ? 24 : 0}
        style={styles.backdrop}
      >
        <Pressable style={styles.backdropTouchable} onPress={onClose} />
        <View style={[styles.sheet, { paddingBottom: spacing.lg + insets.bottom }]}>
          <View style={styles.handle} />
          <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            <Text style={styles.title}>Trip cost calculator</Text>
            <Text style={styles.subtitle}>
              A one-off estimate for this trip — nothing here is saved to the vehicle's history.
            </Text>

            <TextField
              label="Trip distance (km)"
              placeholder="e.g. 45"
              keyboardType="decimal-pad"
              value={distance}
              onChangeText={setDistance}
            />
            <TextField
              label="Tolls, parking, other one-off costs — optional"
              placeholder="0"
              keyboardType="decimal-pad"
              value={extras}
              onChangeText={setExtras}
            />

            {distanceKm <= 0 ? (
              <Text style={styles.hint}>Enter a distance to see an estimate.</Text>
            ) : !result.hasEnoughData ? (
              <View style={styles.resultBox}>
                <Text style={styles.emptyStateText}>
                  Not enough logged {vehicle.fuelType === "electric" ? "charging" : "fuel"} history yet to
                  estimate {vehicle.fuelType === "electric" ? "energy" : "fuel"} cost — log at least one entry
                  with an odometer reading and cost, and this will fill in.
                </Text>
                {extraCosts > 0 && (
                  <Text style={styles.resultLine}>
                    Extra costs entered: {formatMoney(extraCosts, currencyCode)}
                  </Text>
                )}
              </View>
            ) : (
              <View style={styles.resultBox}>
                <Row
                  styles={styles}
                  label={`Estimated ${vehicle.fuelType === "electric" ? "energy" : "fuel"} cost`}
                  value={formatMoney(result.fuelOrEnergyCost ?? 0, currencyCode)}
                />
                {extraCosts > 0 && (
                  <Row styles={styles} label="Tolls / parking / other" value={formatMoney(extraCosts, currencyCode)} />
                )}
                <View style={styles.divider} />
                <Row
                  styles={styles}
                  label="Estimated total"
                  value={formatMoney(result.totalCost ?? 0, currencyCode)}
                  emphasize
                />
                {result.costPerKm != null && (
                  <Row
                    styles={styles}
                    label="Cost per km"
                    value={formatMoney(result.costPerKm, currencyCode)}
                  />
                )}
                <Text style={styles.caveat}>
                  Based on this vehicle's most recent logged efficiency and price — not a live fuel/electricity
                  rate. Labeled Estimated, not Actual.
                </Text>
              </View>
            )}

            <Pressable style={styles.closeButton} onPress={onClose}>
              <Text style={styles.closeButtonText}>Close</Text>
            </Pressable>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function Row({
  styles,
  label,
  value,
  emphasize,
}: {
  styles: ReturnType<typeof makeStyles>;
  label: string;
  value: string;
  emphasize?: boolean;
}) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={[styles.rowValue, emphasize && styles.rowValueEmphasis]}>{value}</Text>
    </View>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    backdrop: {
      flex: 1,
      justifyContent: "flex-end",
      backgroundColor: "rgba(34,38,43,0.4)",
    },
    backdropTouchable: {
      flex: 1,
    },
    sheet: {
      backgroundColor: colors.background,
      borderTopLeftRadius: radii.lg,
      borderTopRightRadius: radii.lg,
      padding: spacing.lg,
      maxHeight: "88%",
    },
    handle: {
      width: 40,
      height: 4,
      borderRadius: 2,
      backgroundColor: colors.border,
      alignSelf: "center",
      marginBottom: spacing.md,
    },
    title: {
      fontFamily: fonts.display,
      fontSize: 20,
      color: colors.textPrimary,
    },
    subtitle: {
      fontFamily: fonts.body,
      fontSize: 13,
      color: colors.textMuted,
      marginTop: 4,
      marginBottom: spacing.md,
    },
    hint: {
      fontFamily: fonts.body,
      fontSize: 13,
      color: colors.textFaint,
      fontStyle: "italic",
      marginTop: spacing.xs,
    },
    resultBox: {
      backgroundColor: colors.surface,
      borderRadius: radii.md,
      borderWidth: 1,
      borderColor: colors.border,
      padding: spacing.md,
      marginTop: spacing.sm,
    },
    emptyStateText: {
      fontFamily: fonts.body,
      fontSize: 13,
      color: colors.textMuted,
    },
    resultLine: {
      fontFamily: fonts.body,
      fontSize: 13,
      color: colors.textPrimary,
      marginTop: spacing.sm,
    },
    row: {
      flexDirection: "row",
      justifyContent: "space-between",
      paddingVertical: spacing.xs,
    },
    rowLabel: {
      fontFamily: fonts.body,
      fontSize: 13,
      color: colors.textMuted,
    },
    rowValue: {
      fontFamily: fonts.mono,
      fontSize: 14,
      color: colors.textPrimary,
    },
    rowValueEmphasis: {
      fontFamily: fonts.bodySemiBold,
      fontSize: 16,
      color: colors.accent,
    },
    divider: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: colors.border,
      marginVertical: spacing.xs,
    },
    caveat: {
      fontFamily: fonts.body,
      fontSize: 11,
      color: colors.textFaint,
      marginTop: spacing.sm,
    },
    closeButton: {
      marginTop: spacing.lg,
      borderRadius: radii.md,
      paddingVertical: spacing.sm + 2,
      alignItems: "center",
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
    },
    closeButtonText: {
      fontFamily: fonts.bodySemiBold,
      color: colors.textPrimary,
    },
  });

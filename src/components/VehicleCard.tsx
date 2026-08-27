import React from "react";
import { View, Text, Pressable, Image, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Vehicle, Urgency } from "@/types/models";
import { fonts, radii, spacing, ThemeColors } from "@/theme/theme";
import { useThemeStore } from "@/theme/useThemeStore";
import { dateUrgency, pmsUrgency, worseOf } from "@/utils/urgency";
import { formatKm, formatDate } from "@/utils/format";
import { EfficiencyDisplay } from "@/utils/vehicleEfficiencyDisplay";
import { usePhotoPicker } from "@/utils/usePhotoPicker";
import { PhotoActionSheet } from "./PhotoActionSheet";
import { AnimatedPressable } from "./AnimatedPressable";
import { UrgencyDot } from "./UrgencyDot";

const URGENCY_SPOKEN: Record<Urgency, string> = { ok: "ok", due_soon: "due soon", overdue: "overdue" };

export function VehicleCard({
  vehicle,
  efficiency,
  driverName,
  onPress,
  onPhotoChange,
}: {
  vehicle: Vehicle;
  efficiency: EfficiencyDisplay;
  /** Display name of vehicle.primaryDriverUserId, resolved by the caller (has the member list). */
  driverName?: string;
  onPress: () => void;
  onPhotoChange: (uri: string | undefined) => void;
}) {
  const colors = useThemeStore((s) => s.colors);
  const styles = makeStyles(colors);
  const { openPicker, sheetProps } = usePhotoPicker(vehicle.photoUri, onPhotoChange);

  const registration = dateUrgency(vehicle.registrationExpiry);
  const insurance = dateUrgency(vehicle.insuranceExpiry);
  const pms = pmsUrgency(vehicle.nextPmsDueDate, vehicle.nextPmsDueKm, vehicle.currentOdometerKm);
  const overall = worseOf(worseOf(registration, insurance), pms);

  const nextDue =
    registration !== "ok"
      ? { label: "Registration", dateIso: vehicle.registrationExpiry }
      : insurance !== "ok"
      ? { label: "Insurance", dateIso: vehicle.insuranceExpiry }
      : pms !== "ok"
      ? { label: "Next PMS", dateIso: vehicle.nextPmsDueDate }
      : null;

  return (
    <AnimatedPressable onPress={onPress} style={styles.card} scaleTo={0.98}>
      <View style={styles.header}>
        <Pressable
          onPress={openPicker}
          style={styles.avatar}
          accessibilityRole="button"
          accessibilityLabel={`Change photo for ${vehicle.name}`}
        >
          {vehicle.photoUri ? (
            <Image source={{ uri: vehicle.photoUri }} style={styles.avatarImage} />
          ) : (
            <Ionicons name="car-sport-outline" size={22} color={colors.textFaint} />
          )}
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={styles.name}>{vehicle.name}</Text>
          <Text style={styles.subtitle}>
            {vehicle.year} {vehicle.make} {vehicle.model}
            {driverName ? ` · ${driverName}` : ""}
          </Text>
        </View>
        <View
          style={styles.dots}
          accessible
          accessibilityLabel={`Registration ${URGENCY_SPOKEN[registration]}, insurance ${URGENCY_SPOKEN[insurance]}, next service ${URGENCY_SPOKEN[pms]}`}
        >
          <UrgencyDot urgency={registration} />
          <UrgencyDot urgency={insurance} />
          <UrgencyDot urgency={pms} />
        </View>
      </View>

      <View style={styles.statsRow}>
        <View>
          <Text style={styles.statLabel}>Odometer</Text>
          <Text style={styles.statValue}>{formatKm(vehicle.currentOdometerKm)}</Text>
        </View>
        <View>
          <Text style={styles.statLabel}>{efficiency.label}</Text>
          <Text style={[styles.statValue, efficiency.implausible && styles.statValueWarning]}>
            {efficiency.text}
          </Text>
        </View>
      </View>
      {nextDue && (
        <Text style={styles.nextRow}>
          <Text style={styles.nextLabel}>Next: </Text>
          <Text style={overall === "overdue" ? styles.nextValueWarning : styles.nextValue}>
            {nextDue.label} · {formatDate(nextDue.dateIso)}
          </Text>
        </Text>
      )}
      <PhotoActionSheet {...sheetProps} />
    </AnimatedPressable>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    card: {
      backgroundColor: colors.surface,
      borderRadius: radii.lg,
      padding: spacing.md,
      marginBottom: spacing.md,
      borderWidth: 1,
      borderColor: colors.border,
    },
    header: {
      flexDirection: "row",
      alignItems: "flex-start",
    },
    avatar: {
      width: 48,
      height: 48,
      borderRadius: radii.md,
      backgroundColor: colors.background,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: "center",
      justifyContent: "center",
      overflow: "hidden",
      marginRight: spacing.sm,
    },
    avatarImage: {
      width: "100%",
      height: "100%",
    },
    name: {
      fontFamily: fonts.display,
      fontSize: 20,
      color: colors.textPrimary,
    },
    subtitle: {
      fontFamily: fonts.body,
      fontSize: 13,
      color: colors.textMuted,
      marginTop: 2,
    },
    dots: {
      flexDirection: "row",
      paddingTop: 4,
    },
    statsRow: {
      flexDirection: "row",
      marginTop: spacing.md,
      gap: spacing.xl,
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
    nextRow: {
      marginTop: spacing.sm,
      fontFamily: fonts.body,
      fontSize: 12,
    },
    nextLabel: {
      fontFamily: fonts.body,
      fontSize: 12,
      color: colors.textFaint,
    },
    nextValue: {
      fontFamily: fonts.bodyMedium,
      fontSize: 12,
      color: colors.textMuted,
    },
    nextValueWarning: {
      fontFamily: fonts.bodyMedium,
      fontSize: 12,
      color: colors.overdueBright,
    },
  });

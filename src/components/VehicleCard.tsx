import React from "react";
import { View, Text, Pressable, Image, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Vehicle } from "@/types/models";
import { fonts, radii, spacing, ThemeColors } from "@/theme/theme";
import { useThemeStore } from "@/theme/useThemeStore";
import { dateUrgency, pmsUrgency } from "@/utils/urgency";
import { formatKm, formatKmPerLiter } from "@/utils/format";
import { LatestEfficiency } from "@/utils/fuelEfficiency";
import { usePhotoPicker } from "@/utils/usePhotoPicker";
import { UrgencyDot } from "./UrgencyDot";

export function VehicleCard({
  vehicle,
  efficiency,
  onPress,
  onPhotoChange,
}: {
  vehicle: Vehicle;
  efficiency: LatestEfficiency;
  onPress: () => void;
  onPhotoChange: (uri: string | undefined) => void;
}) {
  const colors = useThemeStore((s) => s.colors);
  const styles = makeStyles(colors);
  const { openPicker } = usePhotoPicker(vehicle.photoUri, onPhotoChange);

  const registration = dateUrgency(vehicle.registrationExpiry);
  const insurance = dateUrgency(vehicle.insuranceExpiry);
  const pms = pmsUrgency(vehicle.nextPmsDueDate, vehicle.nextPmsDueKm, vehicle.currentOdometerKm);

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
      <View style={styles.header}>
        <Pressable onPress={openPicker} style={styles.avatar}>
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
          </Text>
        </View>
        <View style={styles.dots}>
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
          <Text style={styles.statLabel}>Fuel efficiency</Text>
          <Text style={[styles.statValue, efficiency.implausible && styles.statValueWarning]}>
            {formatKmPerLiter(efficiency.kmPerLiter, efficiency.implausible)}
          </Text>
        </View>
      </View>
    </Pressable>
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
    pressed: {
      opacity: 0.85,
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
  });

import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, Pressable, StyleSheet, Alert, KeyboardAvoidingView, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import uuid from "react-native-uuid";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "@/navigation/types";
import { useAppStore } from "@/state/store";
import { fonts, radii, spacing, ThemeColors } from "@/theme/theme";
import { useThemeStore } from "@/theme/useThemeStore";
import { useCurrencyStore } from "@/state/useCurrencyStore";
import { TextField } from "@/components/TextField";
import { DateField } from "@/components/DateField";
import { PhotoPicker } from "@/components/PhotoPicker";
import { AnimatedPressable } from "@/components/AnimatedPressable";
import { Vehicle, FuelType } from "@/types/models";
import { todayIso } from "@/utils/date";

type Props = NativeStackScreenProps<RootStackParamList, "AddEditVehicle">;

const TODAY = todayIso();

const FUEL_TYPE_OPTIONS: { value: FuelType; label: string }[] = [
  { value: "gas", label: "Gas" },
  { value: "hybrid", label: "Hybrid" },
  { value: "electric", label: "Electric" },
];

export function AddEditVehicleScreen({ route, navigation }: Props) {
  const { vehicleId } = route.params;
  const { vehicles, groupIds, members, loadMembers, addVehicle, updateVehicle, deleteVehicle } = useAppStore();
  const colors = useThemeStore((s) => s.colors);
  const currencyCode = useCurrencyStore((s) => s.code);
  const insets = useSafeAreaInsets();
  const styles = makeStyles(colors);
  const existing = vehicles.find((v) => v.id === vehicleId);
  const isEdit = !!existing;

  const [photoUri, setPhotoUri] = useState<string | undefined>(existing?.photoUri);
  const [name, setName] = useState(existing?.name ?? "");
  const [make, setMake] = useState(existing?.make ?? "");
  const [model, setModel] = useState(existing?.model ?? "");
  const [year, setYear] = useState(existing ? String(existing.year) : "");
  const [plateNumber, setPlateNumber] = useState(existing?.plateNumber ?? "");
  const [vin, setVin] = useState(existing?.vin ?? "");
  const [color, setColor] = useState(existing?.color ?? "");
  const [fuelType, setFuelType] = useState<FuelType>(existing?.fuelType ?? "gas");
  const [purchaseDate, setPurchaseDate] = useState(existing?.purchaseDate ?? TODAY);
  const [purchasePrice, setPurchasePrice] = useState(existing ? String(existing.purchasePrice) : "");
  const [currentOdometerKm, setCurrentOdometerKm] = useState(
    existing ? String(existing.currentOdometerKm) : "0"
  );
  const [registrationExpiry, setRegistrationExpiry] = useState(existing?.registrationExpiry ?? TODAY);
  const [insuranceExpiry, setInsuranceExpiry] = useState(existing?.insuranceExpiry ?? TODAY);
  const [nextPmsDueDate, setNextPmsDueDate] = useState(existing?.nextPmsDueDate ?? TODAY);
  const [nextPmsDueKm, setNextPmsDueKm] = useState(
    existing?.nextPmsDueKm != null ? String(existing.nextPmsDueKm) : ""
  );

  const [batteryCapacityKwh, setBatteryCapacityKwh] = useState(
    existing?.batteryCapacityKwh != null ? String(existing.batteryCapacityKwh) : ""
  );
  const [estimatedRangeKm, setEstimatedRangeKm] = useState(
    existing?.estimatedRangeKm != null ? String(existing.estimatedRangeKm) : ""
  );
  const [chargingPortType, setChargingPortType] = useState(existing?.chargingPortType ?? "");
  const [homeChargingNotes, setHomeChargingNotes] = useState(existing?.homeChargingNotes ?? "");
  const [primaryDriverUserId, setPrimaryDriverUserId] = useState(existing?.primaryDriverUserId ?? "");

  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const showEvDetails = fuelType !== "gas";

  useEffect(() => {
    if (groupIds[0]) loadMembers(groupIds[0]);
  }, [groupIds[0]]);

  async function handleSave() {
    if (submitting) return;
    if (!name.trim() || !make.trim() || !model.trim()) {
      setError("Name, make, and model are required.");
      return;
    }
    const yearNum = Number(year);
    if (!year || Number.isNaN(yearNum) || yearNum < 1900 || yearNum > new Date().getFullYear() + 1) {
      setError("Enter a valid year.");
      return;
    }

    const priceNum = purchasePrice.trim() ? Number(purchasePrice) : 0;
    if (Number.isNaN(priceNum) || priceNum < 0) {
      setError("Purchase price can't be negative.");
      return;
    }
    const odoNum = currentOdometerKm.trim() ? Number(currentOdometerKm) : 0;
    if (Number.isNaN(odoNum) || odoNum < 0) {
      setError("Odometer reading can't be negative.");
      return;
    }
    let pmsKmNum: number | undefined;
    if (nextPmsDueKm.trim()) {
      pmsKmNum = Number(nextPmsDueKm);
      if (Number.isNaN(pmsKmNum) || pmsKmNum < 0) {
        setError("Next PMS due (km) can't be negative.");
        return;
      }
    }
    let batteryCapacityNum: number | undefined;
    if (showEvDetails && batteryCapacityKwh.trim()) {
      batteryCapacityNum = Number(batteryCapacityKwh);
      if (Number.isNaN(batteryCapacityNum) || batteryCapacityNum < 0) {
        setError("Battery capacity can't be negative.");
        return;
      }
    }
    let estimatedRangeNum: number | undefined;
    if (showEvDetails && estimatedRangeKm.trim()) {
      estimatedRangeNum = Number(estimatedRangeKm);
      if (Number.isNaN(estimatedRangeNum) || estimatedRangeNum < 0) {
        setError("Estimated range can't be negative.");
        return;
      }
    }

    const vehicle: Vehicle = {
      id: existing?.id ?? (uuid.v4() as string),
      groupId: existing?.groupId ?? groupIds[0],
      name: name.trim(),
      make: make.trim(),
      model: model.trim(),
      year: yearNum,
      plateNumber: plateNumber.trim(),
      vin: vin.trim(),
      color: color.trim(),
      photoUri,
      fuelType,
      purchaseDate,
      purchasePrice: priceNum,
      currentOdometerKm: odoNum,
      registrationExpiry,
      insuranceExpiry,
      nextPmsDueDate,
      nextPmsDueKm: pmsKmNum,
      batteryCapacityKwh: batteryCapacityNum,
      estimatedRangeKm: estimatedRangeNum,
      chargingPortType: showEvDetails ? chargingPortType.trim() || undefined : undefined,
      homeChargingNotes: showEvDetails ? homeChargingNotes.trim() || undefined : undefined,
      primaryDriverUserId: primaryDriverUserId || undefined,
    };

    setSubmitting(true);
    try {
      if (isEdit) {
        await updateVehicle(vehicle);
      } else {
        await addVehicle(vehicle);
      }
      navigation.goBack();
    } finally {
      setSubmitting(false);
    }
  }

  function handleDelete() {
    if (!existing) return;
    Alert.alert(
      "Delete vehicle?",
      `This removes ${existing.name} and all of its service and fuel history. This can't be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            await deleteVehicle(existing.id);
            navigation.popToTop();
          },
        },
      ]
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "android" ? 24 : 0}
    >
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ padding: spacing.md, paddingBottom: spacing.xl * 2 + insets.bottom }}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.title}>{isEdit ? "Edit vehicle" : "Add a vehicle"}</Text>
      <Text style={styles.requiredLegend}>
        <Text style={styles.requiredLegendAsterisk}>*</Text> Required
      </Text>

      <PhotoPicker photoUri={photoUri} onChange={setPhotoUri} />

      <TextField label="Nickname" required placeholder="e.g. The Beast" value={name} onChangeText={setName} />
      <TextField label="Make" required placeholder="Toyota" value={make} onChangeText={setMake} />
      <TextField label="Model" required placeholder="Fortuner" value={model} onChangeText={setModel} />
      <TextField label="Year" required placeholder="2021" keyboardType="number-pad" value={year} onChangeText={setYear} />
      <TextField label="Plate number" placeholder="NAB 1234" value={plateNumber} onChangeText={setPlateNumber} autoCapitalize="characters" />
      <TextField label="VIN" placeholder="Vehicle identification number" value={vin} onChangeText={setVin} autoCapitalize="characters" />
      <TextField label="Color" placeholder="Silver" value={color} onChangeText={setColor} />

      <View style={styles.fieldGroup}>
        <Text style={styles.fieldLabel}>Fuel type</Text>
        <View style={styles.segmented}>
          {FUEL_TYPE_OPTIONS.map((opt) => {
            const active = fuelType === opt.value;
            return (
              <Pressable
                key={opt.value}
                style={[styles.segment, active && styles.segmentActive]}
                onPress={() => setFuelType(opt.value)}
              >
                <Text style={[styles.segmentText, active && styles.segmentTextActive]}>{opt.label}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {members.length > 0 && (
        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Primary driver</Text>
          <View style={styles.currencyGrid}>
            <Pressable
              style={[styles.currencyChip, !primaryDriverUserId && styles.currencyChipActive]}
              onPress={() => setPrimaryDriverUserId("")}
            >
              <Text style={[styles.currencyChipText, !primaryDriverUserId && styles.currencyChipTextActive]}>
                Unassigned
              </Text>
            </Pressable>
            {members.map((m) => {
              const active = primaryDriverUserId === m.userId;
              return (
                <Pressable
                  key={m.userId}
                  style={[styles.currencyChip, active && styles.currencyChipActive]}
                  onPress={() => setPrimaryDriverUserId(m.userId)}
                >
                  <Text style={[styles.currencyChipText, active && styles.currencyChipTextActive]}>
                    {m.displayName}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      )}

      <DateField label="Purchase date" valueIso={purchaseDate} onChange={setPurchaseDate} />
      <TextField label={`Purchase price (${currencyCode})`} placeholder="0" keyboardType="decimal-pad" value={purchasePrice} onChangeText={setPurchasePrice} />
      <TextField label="Current odometer (km)" placeholder="0" keyboardType="number-pad" value={currentOdometerKm} onChangeText={setCurrentOdometerKm} />

      <Text style={styles.sectionTitle}>Renewals & Maintenance</Text>
      <DateField label="Registration expiry" valueIso={registrationExpiry} onChange={setRegistrationExpiry} />
      <DateField label="Insurance expiry" valueIso={insuranceExpiry} onChange={setInsuranceExpiry} />
      <DateField label="Next PMS due date" valueIso={nextPmsDueDate} onChange={setNextPmsDueDate} />
      <TextField
        label="Next PMS due at (km) — optional"
        placeholder="Leave blank if by date only"
        keyboardType="number-pad"
        value={nextPmsDueKm}
        onChangeText={setNextPmsDueKm}
      />

      {showEvDetails && (
        <>
          <Text style={styles.sectionTitle}>EV details</Text>
          <TextField
            label="Battery capacity (kWh)"
            placeholder="e.g. 60"
            keyboardType="decimal-pad"
            value={batteryCapacityKwh}
            onChangeText={setBatteryCapacityKwh}
          />
          <TextField
            label="Estimated range (km)"
            placeholder="e.g. 400"
            keyboardType="number-pad"
            value={estimatedRangeKm}
            onChangeText={setEstimatedRangeKm}
          />
          <TextField
            label="Charging port type"
            placeholder="e.g. Type 2, CCS, CHAdeMO"
            value={chargingPortType}
            onChangeText={setChargingPortType}
          />
          <TextField
            label="Home charging notes"
            placeholder="e.g. Level 2, 7kW garage charger"
            value={homeChargingNotes}
            onChangeText={setHomeChargingNotes}
            multiline
          />
        </>
      )}

      {error && <Text style={styles.error}>{error}</Text>}

      <AnimatedPressable
        style={styles.saveButton}
        onPress={handleSave}
        disabled={submitting}
      >
        <Text style={styles.saveText}>
          {submitting ? "Saving…" : isEdit ? "Save changes" : "Add vehicle"}
        </Text>
      </AnimatedPressable>

      {isEdit && (
        <Pressable style={styles.deleteButton} onPress={handleDelete}>
          <Text style={styles.deleteText}>Delete vehicle</Text>
        </Pressable>
      )}
    </ScrollView>
    </KeyboardAvoidingView>
  );
}

const makeStyles = (colors: ThemeColors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  title: {
    fontFamily: fonts.display,
    fontSize: 24,
    color: colors.textPrimary,
  },
  requiredLegend: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.textMuted,
    marginTop: spacing.xs,
    marginBottom: spacing.lg,
  },
  requiredLegendAsterisk: {
    color: colors.overdueBright,
  },
  sectionTitle: {
    fontFamily: fonts.display,
    fontSize: 16,
    color: colors.textPrimary,
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
  },
  fieldGroup: {
    marginBottom: spacing.md,
  },
  fieldLabel: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.textMuted,
    marginBottom: 4,
  },
  segmented: {
    flexDirection: "row",
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
  },
  segment: {
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: "center",
    backgroundColor: colors.surface,
  },
  segmentActive: {
    backgroundColor: colors.accent,
  },
  segmentText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 13,
    color: colors.textMuted,
  },
  segmentTextActive: {
    color: colors.onAccent,
    fontFamily: fonts.bodySemiBold,
  },
  currencyGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  currencyChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  currencyChipActive: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  currencyChipText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 13,
    color: colors.textMuted,
  },
  currencyChipTextActive: {
    color: colors.onAccent,
    fontFamily: fonts.bodySemiBold,
  },
  error: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.overdueBright,
    marginBottom: spacing.sm,
  },
  saveButton: {
    backgroundColor: colors.accent,
    borderRadius: radii.lg,
    paddingVertical: spacing.md,
    alignItems: "center",
    marginTop: spacing.md,
  },
  saveText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 16,
    color: colors.onAccent,
  },
  deleteButton: {
    borderRadius: radii.lg,
    paddingVertical: spacing.md,
    alignItems: "center",
    marginTop: spacing.sm,
    borderWidth: 1,
    borderColor: colors.overdue,
  },
  deleteText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 15,
    color: colors.overdueBright,
  },
});

import React, { useState } from "react";
import { View, Text, ScrollView, Pressable, StyleSheet, Alert } from "react-native";
import uuid from "react-native-uuid";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "@/navigation/types";
import { useAppStore } from "@/state/store";
import { colors, fonts, radii, spacing } from "@/theme/theme";
import { TextField } from "@/components/TextField";
import { DateField } from "@/components/DateField";
import { Vehicle } from "@/types/models";

type Props = NativeStackScreenProps<RootStackParamList, "AddEditVehicle">;

const TODAY = new Date().toISOString().slice(0, 10);

export function AddEditVehicleScreen({ route, navigation }: Props) {
  const { vehicleId } = route.params;
  const { vehicles, groupIds, addVehicle, updateVehicle, deleteVehicle } = useAppStore();
  const existing = vehicles.find((v) => v.id === vehicleId);
  const isEdit = !!existing;

  const [name, setName] = useState(existing?.name ?? "");
  const [make, setMake] = useState(existing?.make ?? "");
  const [model, setModel] = useState(existing?.model ?? "");
  const [year, setYear] = useState(existing ? String(existing.year) : "");
  const [plateNumber, setPlateNumber] = useState(existing?.plateNumber ?? "");
  const [vin, setVin] = useState(existing?.vin ?? "");
  const [color, setColor] = useState(existing?.color ?? "");
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

  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    if (!name.trim() || !make.trim() || !model.trim()) {
      setError("Name, make, and model are required.");
      return;
    }
    const yearNum = Number(year);
    if (!year || Number.isNaN(yearNum)) {
      setError("Enter a valid year.");
      return;
    }
    const priceNum = Number(purchasePrice) || 0;
    const odoNum = Number(currentOdometerKm) || 0;
    const pmsKmNum = nextPmsDueKm ? Number(nextPmsDueKm) : undefined;

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
      purchaseDate,
      purchasePrice: priceNum,
      currentOdometerKm: odoNum,
      registrationExpiry,
      insuranceExpiry,
      nextPmsDueDate,
      nextPmsDueKm: pmsKmNum,
    };

    if (isEdit) {
      await updateVehicle(vehicle);
    } else {
      await addVehicle(vehicle);
    }
    navigation.goBack();
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
    <ScrollView style={styles.container} contentContainerStyle={{ padding: spacing.md, paddingBottom: spacing.xl * 2 }}>
      <Text style={styles.title}>{isEdit ? "Edit vehicle" : "Add a vehicle"}</Text>

      <TextField label="Nickname" placeholder="e.g. The Beast" value={name} onChangeText={setName} />
      <TextField label="Make" placeholder="Toyota" value={make} onChangeText={setMake} />
      <TextField label="Model" placeholder="Fortuner" value={model} onChangeText={setModel} />
      <TextField label="Year" placeholder="2021" keyboardType="number-pad" value={year} onChangeText={setYear} />
      <TextField label="Plate number" placeholder="NAB 1234" value={plateNumber} onChangeText={setPlateNumber} autoCapitalize="characters" />
      <TextField label="VIN" placeholder="Vehicle identification number" value={vin} onChangeText={setVin} autoCapitalize="characters" />
      <TextField label="Color" placeholder="Silver" value={color} onChangeText={setColor} />

      <DateField label="Purchase date" valueIso={purchaseDate} onChange={setPurchaseDate} />
      <TextField label="Purchase price (₱)" placeholder="0" keyboardType="decimal-pad" value={purchasePrice} onChangeText={setPurchasePrice} />
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

      {error && <Text style={styles.error}>{error}</Text>}

      <Pressable style={styles.saveButton} onPress={handleSave}>
        <Text style={styles.saveText}>{isEdit ? "Save changes" : "Add vehicle"}</Text>
      </Pressable>

      {isEdit && (
        <Pressable style={styles.deleteButton} onPress={handleDelete}>
          <Text style={styles.deleteText}>Delete vehicle</Text>
        </Pressable>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  title: {
    fontFamily: fonts.display,
    fontSize: 24,
    color: colors.textPrimary,
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontFamily: fonts.display,
    fontSize: 16,
    color: colors.textPrimary,
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
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

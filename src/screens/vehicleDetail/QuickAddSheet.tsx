import React, { useState } from "react";
import { Modal, View, Text, Pressable, StyleSheet, KeyboardAvoidingView, Platform } from "react-native";
import uuid from "react-native-uuid";
import { fonts, radii, spacing, ThemeColors } from "@/theme/theme";
import { useThemeStore } from "@/theme/useThemeStore";
import { TextField } from "@/components/TextField";
import { DateField } from "@/components/DateField";
import { useAppStore } from "@/state/store";
import { useVehicle } from "./VehicleContext";

type Kind = "fuel" | "service" | "charging";

export function QuickAddSheet({
  kind,
  visible,
  onClose,
}: {
  kind: Kind;
  visible: boolean;
  onClose: () => void;
}) {
  const vehicle = useVehicle();
  const { addFuelEntry, addServiceEntry, addChargingEntry } = useAppStore();
  const colors = useThemeStore((s) => s.colors);
  const styles = makeStyles(colors);

  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [odometerKm, setOdometerKm] = useState(String(vehicle.currentOdometerKm));
  const [cost, setCost] = useState("");
  // fuel-only
  const [liters, setLiters] = useState("");
  // charging-only
  const [kwh, setKwh] = useState("");
  // service-only
  const [type, setType] = useState("");
  const [shop, setShop] = useState("");
  const [notes, setNotes] = useState("");

  const [error, setError] = useState<string | null>(null);

  function reset() {
    setDate(new Date().toISOString().slice(0, 10));
    setOdometerKm(String(vehicle.currentOdometerKm));
    setCost("");
    setLiters("");
    setKwh("");
    setType("");
    setShop("");
    setNotes("");
    setError(null);
  }

  function close() {
    reset();
    onClose();
  }

  async function handleSave() {
    const odo = Number(odometerKm);
    const costNum = Number(cost);

    if (!odometerKm || Number.isNaN(odo) || odo < 0) {
      setError("Enter a valid odometer reading.");
      return;
    }
    if (!cost || Number.isNaN(costNum) || costNum < 0) {
      setError("Enter a valid cost.");
      return;
    }

    if (kind === "fuel") {
      const litersNum = Number(liters);
      if (!liters || Number.isNaN(litersNum) || litersNum <= 0) {
        setError("Enter a valid amount of fuel (liters).");
        return;
      }
      await addFuelEntry({
        id: uuid.v4() as string,
        vehicleId: vehicle.id,
        date,
        liters: litersNum,
        cost: costNum,
        odometerKm: odo,
      });
    } else if (kind === "charging") {
      const kwhNum = Number(kwh);
      if (!kwh || Number.isNaN(kwhNum) || kwhNum <= 0) {
        setError("Enter a valid amount of energy (kWh).");
        return;
      }
      await addChargingEntry({
        id: uuid.v4() as string,
        vehicleId: vehicle.id,
        date,
        kwh: kwhNum,
        cost: costNum,
        odometerKm: odo,
      });
    } else {
      if (!type.trim()) {
        setError("Enter a service type, e.g. Oil change.");
        return;
      }
      await addServiceEntry({
        id: uuid.v4() as string,
        vehicleId: vehicle.id,
        date,
        type: type.trim(),
        cost: costNum,
        shop: shop.trim(),
        odometerKm: odo,
        notes: notes.trim() || undefined,
      });
    }
    close();
  }

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={close}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.backdrop}
      >
        <Pressable style={styles.backdropTouchable} onPress={close} />
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <Text style={styles.title}>
            {kind === "fuel" ? "Log fuel" : kind === "charging" ? "Log a charge" : "Log a service"}
          </Text>

          <DateField label="Date" valueIso={date} onChange={setDate} />

          {kind === "service" && (
            <TextField
              label="Service type"
              placeholder="Oil change, Brake pads, ..."
              value={type}
              onChangeText={setType}
            />
          )}

          {kind === "fuel" && (
            <TextField
              label="Liters"
              placeholder="0.0"
              keyboardType="decimal-pad"
              value={liters}
              onChangeText={setLiters}
            />
          )}

          {kind === "charging" && (
            <TextField
              label="Energy added (kWh)"
              placeholder="0.0"
              keyboardType="decimal-pad"
              value={kwh}
              onChangeText={setKwh}
            />
          )}

          <TextField
            label="Cost (₱)"
            placeholder="0"
            keyboardType="decimal-pad"
            value={cost}
            onChangeText={setCost}
          />

          <TextField
            label="Odometer (km)"
            placeholder="0"
            keyboardType="number-pad"
            value={odometerKm}
            onChangeText={setOdometerKm}
          />

          {kind === "service" && (
            <>
              <TextField label="Shop" placeholder="Where was this done?" value={shop} onChangeText={setShop} />
              <TextField
                label="Notes (optional)"
                placeholder="Anything worth remembering"
                value={notes}
                onChangeText={setNotes}
                multiline
              />
            </>
          )}

          {error && <Text style={styles.error}>{error}</Text>}

          <View style={styles.actions}>
            <Pressable style={[styles.button, styles.cancelButton]} onPress={close}>
              <Text style={styles.cancelText}>Cancel</Text>
            </Pressable>
            <Pressable style={[styles.button, styles.saveButton]} onPress={handleSave}>
              <Text style={styles.saveText}>Save</Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const makeStyles = (colors: ThemeColors) => StyleSheet.create({
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
    marginBottom: spacing.md,
  },
  error: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.overdueBright,
    marginBottom: spacing.sm,
  },
  actions: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  button: {
    flex: 1,
    borderRadius: radii.md,
    paddingVertical: spacing.sm + 2,
    alignItems: "center",
  },
  cancelButton: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cancelText: {
    fontFamily: fonts.bodySemiBold,
    color: colors.textPrimary,
  },
  saveButton: {
    backgroundColor: colors.accent,
  },
  saveText: {
    fontFamily: fonts.bodySemiBold,
    color: colors.onAccent,
  },
});

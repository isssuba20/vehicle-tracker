import React, { useEffect, useState } from "react";
import {
  Modal,
  View,
  Text,
  Pressable,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import uuid from "react-native-uuid";
import { fonts, radii, spacing, ThemeColors } from "@/theme/theme";
import { useThemeStore } from "@/theme/useThemeStore";
import { useCurrencyStore } from "@/state/useCurrencyStore";
import { TextField } from "@/components/TextField";
import { DateField } from "@/components/DateField";
import { useAppStore } from "@/state/store";
import { useVehicle } from "./VehicleContext";
import { FuelLogEntry, ServiceLogEntry, ChargingLogEntry } from "@/types/models";

type Kind = "fuel" | "service" | "charging";
type Entry = FuelLogEntry | ServiceLogEntry | ChargingLogEntry;

export function QuickAddSheet({
  kind,
  visible,
  onClose,
  entry,
}: {
  kind: Kind;
  visible: boolean;
  onClose: () => void;
  /** When set, the sheet edits (and can delete) this entry instead of creating a new one. */
  entry?: Entry;
}) {
  const vehicle = useVehicle();
  const {
    addFuelEntry,
    addServiceEntry,
    addChargingEntry,
    updateFuelEntry,
    updateServiceEntry,
    updateChargingEntry,
    deleteFuelEntry,
    deleteServiceEntry,
    deleteChargingEntry,
  } = useAppStore();
  const colors = useThemeStore((s) => s.colors);
  const currencyCode = useCurrencyStore((s) => s.code);
  const styles = makeStyles(colors);
  const isEdit = !!entry;

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
  const [submitting, setSubmitting] = useState(false);

  // Sheet stays mounted while hidden (Modal just toggles visible), so fields
  // need to be (re)populated each time it opens rather than only at mount.
  useEffect(() => {
    if (!visible) return;
    setError(null);
    if (entry) {
      setDate(entry.date);
      setOdometerKm(String(entry.odometerKm));
      setCost(String(entry.cost));
      if (kind === "fuel") setLiters(String((entry as FuelLogEntry).liters));
      if (kind === "charging") setKwh(String((entry as ChargingLogEntry).kwh));
      if (kind === "service") {
        setType((entry as ServiceLogEntry).type);
        setShop((entry as ServiceLogEntry).shop);
        setNotes((entry as ServiceLogEntry).notes ?? "");
      }
    } else {
      setDate(new Date().toISOString().slice(0, 10));
      setOdometerKm(String(vehicle.currentOdometerKm));
      setCost("");
      setLiters("");
      setKwh("");
      setType("");
      setShop("");
      setNotes("");
    }
  }, [visible, entry, kind]);

  function close() {
    onClose();
  }

  async function handleSave() {
    if (submitting) return;

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

    setSubmitting(true);
    try {
      if (kind === "fuel") {
        const litersNum = Number(liters);
        if (!liters || Number.isNaN(litersNum) || litersNum <= 0) {
          setError("Enter a valid amount of fuel (liters).");
          return;
        }
        const payload: FuelLogEntry = {
          id: entry?.id ?? (uuid.v4() as string),
          vehicleId: vehicle.id,
          date,
          liters: litersNum,
          cost: costNum,
          odometerKm: odo,
        };
        if (isEdit) await updateFuelEntry(payload);
        else await addFuelEntry(payload);
      } else if (kind === "charging") {
        const kwhNum = Number(kwh);
        if (!kwh || Number.isNaN(kwhNum) || kwhNum <= 0) {
          setError("Enter a valid amount of energy (kWh).");
          return;
        }
        const payload: ChargingLogEntry = {
          id: entry?.id ?? (uuid.v4() as string),
          vehicleId: vehicle.id,
          date,
          kwh: kwhNum,
          cost: costNum,
          odometerKm: odo,
        };
        if (isEdit) await updateChargingEntry(payload);
        else await addChargingEntry(payload);
      } else {
        if (!type.trim()) {
          setError("Enter a service type, e.g. Oil change.");
          return;
        }
        const payload: ServiceLogEntry = {
          id: entry?.id ?? (uuid.v4() as string),
          vehicleId: vehicle.id,
          date,
          type: type.trim(),
          cost: costNum,
          shop: shop.trim(),
          odometerKm: odo,
          notes: notes.trim() || undefined,
        };
        if (isEdit) await updateServiceEntry(payload);
        else await addServiceEntry(payload);
      }
      close();
    } finally {
      setSubmitting(false);
    }
  }

  function handleDelete() {
    if (!entry) return;
    const label = kind === "fuel" ? "fuel log" : kind === "charging" ? "charging log" : "service entry";
    Alert.alert(`Delete this ${label}?`, "This can't be undone.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          if (kind === "fuel") await deleteFuelEntry(entry.id, vehicle.id);
          else if (kind === "charging") await deleteChargingEntry(entry.id, vehicle.id);
          else await deleteServiceEntry(entry.id, vehicle.id);
          close();
        },
      },
    ]);
  }

  const title = isEdit
    ? kind === "fuel"
      ? "Edit fuel log"
      : kind === "charging"
      ? "Edit charging log"
      : "Edit service entry"
    : kind === "fuel"
    ? "Log fuel"
    : kind === "charging"
    ? "Log a charge"
    : "Log a service";

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={close}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "android" ? 24 : 0}
        style={styles.backdrop}
      >
        <Pressable style={styles.backdropTouchable} onPress={close} />
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            <Text style={styles.title}>{title}</Text>

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
              label={`Cost (${currencyCode})`}
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
              <Pressable
                style={[styles.button, styles.saveButton, submitting && styles.saveButtonDisabled]}
                onPress={handleSave}
                disabled={submitting}
              >
                <Text style={styles.saveText}>{submitting ? "Saving…" : "Save"}</Text>
              </Pressable>
            </View>

            {isEdit && (
              <Pressable style={styles.deleteButton} onPress={handleDelete}>
                <Text style={styles.deleteText}>Delete</Text>
              </Pressable>
            )}
          </ScrollView>
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
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveText: {
    fontFamily: fonts.bodySemiBold,
    color: colors.onAccent,
  },
  deleteButton: {
    borderRadius: radii.md,
    paddingVertical: spacing.sm + 2,
    alignItems: "center",
    marginTop: spacing.sm,
    borderWidth: 1,
    borderColor: colors.overdue,
  },
  deleteText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 14,
    color: colors.overdueBright,
  },
});

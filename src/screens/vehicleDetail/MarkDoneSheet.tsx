import React, { useEffect, useState } from "react";
import { Modal, View, Text, Pressable, ScrollView, StyleSheet, KeyboardAvoidingView, Platform } from "react-native";
import { fonts, radii, spacing, ThemeColors } from "@/theme/theme";
import { useThemeStore } from "@/theme/useThemeStore";
import { TextField } from "@/components/TextField";
import { DateField } from "@/components/DateField";
import { useAppStore } from "@/state/store";
import { Vehicle } from "@/types/models";

export type RenewalKind = "registration" | "insurance" | "pms";

function isoMonthsFromToday(months: number): string {
  const d = new Date();
  d.setMonth(d.getMonth() + months);
  return d.toISOString().slice(0, 10);
}

const KIND_META: Record<RenewalKind, { title: string; dateLabel: string; defaultMonths: number }> = {
  registration: { title: "Registration renewed", dateLabel: "New expiry date", defaultMonths: 12 },
  insurance: { title: "Insurance renewed", dateLabel: "New expiry date", defaultMonths: 12 },
  pms: { title: "Service completed", dateLabel: "Next due date", defaultMonths: 6 },
};

export function MarkDoneSheet({
  kind,
  visible,
  vehicle,
  onClose,
}: {
  kind: RenewalKind;
  visible: boolean;
  vehicle: Vehicle;
  onClose: () => void;
}) {
  const updateVehicle = useAppStore((s) => s.updateVehicle);
  const colors = useThemeStore((s) => s.colors);
  const styles = makeStyles(colors);
  const meta = KIND_META[kind];

  const [date, setDate] = useState(isoMonthsFromToday(meta.defaultMonths));
  const [dueKm, setDueKm] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setDate(isoMonthsFromToday(meta.defaultMonths));
    setDueKm(kind === "pms" ? String(vehicle.currentOdometerKm + 5000) : "");
  }, [visible, kind]);

  async function handleSave() {
    if (submitting) return;
    setSubmitting(true);
    try {
      if (kind === "registration") {
        await updateVehicle({ ...vehicle, registrationExpiry: date });
      } else if (kind === "insurance") {
        await updateVehicle({ ...vehicle, insuranceExpiry: date });
      } else {
        const kmNum = dueKm.trim() ? Number(dueKm) : undefined;
        await updateVehicle({
          ...vehicle,
          nextPmsDueDate: date,
          nextPmsDueKm: kmNum != null && !Number.isNaN(kmNum) ? kmNum : undefined,
        });
      }
      onClose();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "android" ? 24 : 0}
        style={styles.backdrop}
      >
        <Pressable style={styles.backdropTouchable} onPress={onClose} />
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            <Text style={styles.title}>{meta.title}</Text>

            <DateField label={meta.dateLabel} valueIso={date} onChange={setDate} />

            {kind === "pms" && (
              <TextField
                label="Next due at (km) — optional"
                placeholder="Leave blank if by date only"
                keyboardType="number-pad"
                value={dueKm}
                onChangeText={setDueKm}
              />
            )}

            <View style={styles.actions}>
              <Pressable style={[styles.button, styles.cancelButton]} onPress={onClose}>
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
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
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
      marginBottom: spacing.md,
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
  });

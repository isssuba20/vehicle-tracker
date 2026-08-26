import React, { useEffect, useRef, useState } from "react";
import { Modal, View, Text, Pressable, ScrollView, Animated, StyleSheet, KeyboardAvoidingView, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { fonts, radii, spacing, ThemeColors } from "@/theme/theme";
import { useThemeStore } from "@/theme/useThemeStore";
import { TextField } from "@/components/TextField";
import { DateField } from "@/components/DateField";
import { AnimatedPressable } from "@/components/AnimatedPressable";
import { useAppStore } from "@/state/store";
import { formatDate } from "@/utils/format";
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

const COMPLETE_DISMISS_MS = 900;

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
  const [completed, setCompleted] = useState(false);
  const checkAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!visible) return;
    setDate(isoMonthsFromToday(meta.defaultMonths));
    setDueKm(kind === "pms" ? String(vehicle.currentOdometerKm + 5000) : "");
    setCompleted(false);
    checkAnim.setValue(0);
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
      setCompleted(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      Animated.timing(checkAnim, { toValue: 1, duration: 220, useNativeDriver: true }).start();
      setTimeout(onClose, COMPLETE_DISMISS_MS);
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

          {completed ? (
            <View style={styles.completedWrap}>
              <Animated.View
                style={[
                  styles.checkCircle,
                  {
                    opacity: checkAnim,
                    transform: [{ scale: checkAnim.interpolate({ inputRange: [0, 1], outputRange: [0.85, 1] }) }],
                  },
                ]}
              >
                <Ionicons name="checkmark" size={30} color={colors.onAccent} />
              </Animated.View>
              <Text style={styles.completedText}>{meta.title}</Text>
              <Text style={styles.completedSubtext}>Next due {formatDate(date)}</Text>
            </View>
          ) : (
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
                <AnimatedPressable
                  style={[styles.button, styles.saveButton]}
                  onPress={handleSave}
                  disabled={submitting}
                >
                  <Text style={styles.saveText}>{submitting ? "Saving…" : "Save"}</Text>
                </AnimatedPressable>
              </View>
            </ScrollView>
          )}
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
    saveText: {
      fontFamily: fonts.bodySemiBold,
      color: colors.onAccent,
    },
    completedWrap: {
      alignItems: "center",
      paddingVertical: spacing.xl,
    },
    checkCircle: {
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: colors.ok,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: spacing.md,
    },
    completedText: {
      fontFamily: fonts.bodySemiBold,
      fontSize: 16,
      color: colors.textPrimary,
    },
    completedSubtext: {
      fontFamily: fonts.body,
      fontSize: 13,
      color: colors.textMuted,
      marginTop: 4,
    },
  });

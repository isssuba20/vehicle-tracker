import React from "react";
import { Modal, View, Text, Pressable, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { fonts, radii, spacing, ThemeColors } from "@/theme/theme";
import { useThemeStore } from "@/theme/useThemeStore";

/**
 * A custom bottom sheet for the vehicle-photo menu instead of Alert.alert:
 * Android's native alert only renders up to 3 buttons, and this menu needs
 * 4 (Take photo / Choose from library / Remove photo / Cancel) whenever a
 * photo already exists — one option was silently getting dropped.
 */
export function PhotoActionSheet({
  visible,
  hasPhoto,
  onTakePhoto,
  onPickLibrary,
  onRemove,
  onClose,
}: {
  visible: boolean;
  hasPhoto: boolean;
  onTakePhoto: () => void;
  onPickLibrary: () => void;
  onRemove: () => void;
  onClose: () => void;
}) {
  const colors = useThemeStore((s) => s.colors);
  const styles = makeStyles(colors);

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Pressable style={styles.backdropTouchable} onPress={onClose} />
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <Text style={styles.title}>Vehicle photo</Text>

          <Pressable style={styles.option} onPress={onTakePhoto}>
            <Ionicons name="camera-outline" size={20} color={colors.textPrimary} />
            <Text style={styles.optionText}>Take photo</Text>
          </Pressable>

          <Pressable style={styles.option} onPress={onPickLibrary}>
            <Ionicons name="images-outline" size={20} color={colors.textPrimary} />
            <Text style={styles.optionText}>Choose from library</Text>
          </Pressable>

          {hasPhoto && (
            <Pressable style={styles.option} onPress={onRemove}>
              <Ionicons name="trash-outline" size={20} color={colors.overdueBright} />
              <Text style={[styles.optionText, styles.removeText]}>Remove photo</Text>
            </Pressable>
          )}

          <Pressable style={styles.cancelButton} onPress={onClose}>
            <Text style={styles.cancelText}>Cancel</Text>
          </Pressable>
        </View>
      </View>
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
      fontSize: 18,
      color: colors.textPrimary,
      marginBottom: spacing.md,
    },
    option: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
      paddingVertical: spacing.sm + 2,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.border,
    },
    optionText: {
      fontFamily: fonts.bodyMedium,
      fontSize: 15,
      color: colors.textPrimary,
    },
    removeText: {
      color: colors.overdueBright,
    },
    cancelButton: {
      marginTop: spacing.md,
      borderRadius: radii.md,
      paddingVertical: spacing.sm + 2,
      alignItems: "center",
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
    },
    cancelText: {
      fontFamily: fonts.bodySemiBold,
      fontSize: 14,
      color: colors.textPrimary,
    },
  });

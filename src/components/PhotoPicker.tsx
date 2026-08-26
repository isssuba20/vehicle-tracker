import React from "react";
import { View, Text, Pressable, Image, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { fonts, radii, spacing, ThemeColors } from "@/theme/theme";
import { useThemeStore } from "@/theme/useThemeStore";
import { usePhotoPicker } from "@/utils/usePhotoPicker";
import { PhotoActionSheet } from "./PhotoActionSheet";

export function PhotoPicker({
  photoUri,
  onChange,
}: {
  photoUri?: string;
  onChange: (uri: string | undefined) => void;
}) {
  const colors = useThemeStore((s) => s.colors);
  const styles = makeStyles(colors);
  const { openPicker, sheetProps } = usePhotoPicker(photoUri, onChange);

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Photo</Text>
      <Pressable style={styles.tile} onPress={openPicker}>
        {photoUri ? (
          <Image source={{ uri: photoUri }} style={styles.image} />
        ) : (
          <View style={styles.placeholder}>
            <Ionicons name="camera-outline" size={28} color={colors.textFaint} />
            <Text style={styles.placeholderText}>Add a photo</Text>
          </View>
        )}
      </Pressable>
      <PhotoActionSheet {...sheetProps} />
    </View>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      marginBottom: spacing.md,
    },
    label: {
      fontFamily: fonts.body,
      fontSize: 12,
      color: colors.textMuted,
      marginBottom: 4,
    },
    tile: {
      height: 160,
      borderRadius: radii.md,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      overflow: "hidden",
    },
    image: {
      width: "100%",
      height: "100%",
    },
    placeholder: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      gap: spacing.xs,
    },
    placeholderText: {
      fontFamily: fonts.body,
      fontSize: 13,
      color: colors.textFaint,
    },
  });

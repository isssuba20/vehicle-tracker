import { useState } from "react";
import { Alert } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Paths, File, Directory } from "expo-file-system";

/**
 * Copies a picked image into the app's document directory so it survives
 * OS cache eviction — expo-image-picker's returned URI otherwise points
 * into a temporary cache location that isn't guaranteed to stick around.
 */
function persistPickedImage(sourceUri: string): string {
  const dir = new Directory(Paths.document, "vehicle-photos");
  if (!dir.exists) dir.create({ intermediates: true });

  const extension = sourceUri.split(".").pop()?.split("?")[0] || "jpg";
  const destFile = new File(dir, `${Date.now()}.${extension}`);
  new File(sourceUri).copy(destFile);
  return destFile.uri;
}

export function usePhotoPicker(photoUri: string | undefined, onChange: (uri: string | undefined) => void) {
  const [sheetVisible, setSheetVisible] = useState(false);

  async function pickFromLibrary() {
    setSheetVisible(false);
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Photos access needed", "Allow photo library access in Settings to choose a picture.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      onChange(persistPickedImage(result.assets[0].uri));
    }
  }

  async function takePhoto() {
    setSheetVisible(false);
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Camera access needed", "Allow camera access in Settings to take a picture.");
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      onChange(persistPickedImage(result.assets[0].uri));
    }
  }

  function confirmRemove() {
    setSheetVisible(false);
    Alert.alert("Remove this photo?", "You can add a new one anytime.", [
      { text: "Cancel", style: "cancel" },
      { text: "Remove", style: "destructive", onPress: () => onChange(undefined) },
    ]);
  }

  function openPicker() {
    setSheetVisible(true);
  }

  return {
    openPicker,
    sheetProps: {
      visible: sheetVisible,
      hasPhoto: !!photoUri,
      onTakePhoto: takePhoto,
      onPickLibrary: pickFromLibrary,
      onRemove: confirmRemove,
      onClose: () => setSheetVisible(false),
    },
  };
}

import { Platform } from "react-native";
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import Constants from "expo-constants";
import { supabase } from "@/data/supabase/client";

/**
 * Requests notification permission and registers this device's Expo push
 * token against the signed-in user, so the daily-reminders Edge Function
 * (see supabase/functions/daily-reminders) can reach it. Silently no-ops
 * on a simulator/emulator (no push capability) or if permission is denied.
 */
export async function registerPushToken(userId: string): Promise<void> {
  if (!supabase || !Device.isDevice) return;

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "Default",
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== "granted") return;

  const projectId = Constants.expoConfig?.extra?.eas?.projectId;
  if (!projectId) return;

  const { data } = await Notifications.getExpoPushTokenAsync({ projectId });

  await supabase
    .from("push_tokens")
    .upsert({ token: data, userId, updatedAt: new Date().toISOString() });
}

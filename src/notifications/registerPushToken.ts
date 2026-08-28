import { Platform } from "react-native";
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import Constants from "expo-constants";
import { supabase } from "@/data/supabase/client";

export type PushRegistrationResult =
  | { status: "registered" }
  | { status: "no-backend" }
  | { status: "not-a-device" }
  | { status: "permission-denied" }
  | { status: "no-project-id" }
  | { status: "error"; message: string };

/**
 * Requests notification permission and registers this device's Expo push
 * token against the signed-in user, so the daily-reminders Edge Function
 * (see supabase/functions/daily-reminders) can reach it.
 *
 * Returns a specific outcome rather than silently swallowing every
 * failure — the previous version returned void on every early-out and
 * every thrown error alike, which made "nothing showed up in
 * push_tokens" undiagnosable from either the user's or my side (no
 * device log access). Settings' "Notifications" section surfaces this
 * result directly.
 */
export async function registerPushToken(userId: string): Promise<PushRegistrationResult> {
  if (!supabase) return { status: "no-backend" };
  if (!Device.isDevice) return { status: "not-a-device" };

  try {
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
    if (finalStatus !== "granted") return { status: "permission-denied" };

    const projectId = Constants.expoConfig?.extra?.eas?.projectId;
    if (!projectId) return { status: "no-project-id" };

    const { data } = await Notifications.getExpoPushTokenAsync({ projectId });

    const { error } = await supabase
      .from("push_tokens")
      .upsert({ token: data, userId, updatedAt: new Date().toISOString() });
    if (error) return { status: "error", message: error.message };

    return { status: "registered" };
  } catch (err) {
    return { status: "error", message: err instanceof Error ? err.message : String(err) };
  }
}

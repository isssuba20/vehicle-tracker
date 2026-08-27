import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "garahe-reminder-settings";

export const DEFAULT_DUE_SOON_DAYS = 30;
export const DEFAULT_DUE_SOON_KM = 500;

/** Sane bounds so a typo (or a 0) doesn't turn every renewal permanently "overdue" or silently hide them. */
export const MIN_DUE_SOON_DAYS = 1;
export const MAX_DUE_SOON_DAYS = 180;
export const MIN_DUE_SOON_KM = 50;
export const MAX_DUE_SOON_KM = 5000;

interface ReminderSettingsState {
  dueSoonDays: number;
  dueSoonKm: number;
  hydrated: boolean;
  init: () => Promise<void>;
  setDueSoonDays: (days: number) => Promise<void>;
  setDueSoonKm: (km: number) => Promise<void>;
}

function clamp(n: number, min: number, max: number): number {
  if (Number.isNaN(n)) return min;
  return Math.min(max, Math.max(min, n));
}

/**
 * The "due soon" window (registration/insurance by date, PMS by km) was
 * previously a hardcoded 30 days / 500 km in urgency.ts. Local-device
 * setting, same pattern as currency/theme — not synced to a backend, so
 * it only affects what this device displays. The daily push-notification
 * Edge Function (supabase/functions/daily-reminders) still uses its own
 * hardcoded 30/500 independently, since it has no way to read a
 * device-local AsyncStorage value — see DECISIONS.md.
 */
export const useReminderSettingsStore = create<ReminderSettingsState>((set) => ({
  dueSoonDays: DEFAULT_DUE_SOON_DAYS,
  dueSoonKm: DEFAULT_DUE_SOON_KM,
  hydrated: false,

  init: async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        set({
          dueSoonDays: clamp(Number(parsed.dueSoonDays), MIN_DUE_SOON_DAYS, MAX_DUE_SOON_DAYS),
          dueSoonKm: clamp(Number(parsed.dueSoonKm), MIN_DUE_SOON_KM, MAX_DUE_SOON_KM),
          hydrated: true,
        });
        return;
      }
    } catch {
      // Corrupt/missing value — fall through to defaults below.
    }
    set({ hydrated: true });
  },

  setDueSoonDays: async (days: number) => {
    const dueSoonDays = clamp(days, MIN_DUE_SOON_DAYS, MAX_DUE_SOON_DAYS);
    set({ dueSoonDays });
    const { dueSoonKm } = useReminderSettingsStore.getState();
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ dueSoonDays, dueSoonKm }));
  },

  setDueSoonKm: async (km: number) => {
    const dueSoonKm = clamp(km, MIN_DUE_SOON_KM, MAX_DUE_SOON_KM);
    set({ dueSoonKm });
    const { dueSoonDays } = useReminderSettingsStore.getState();
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ dueSoonDays, dueSoonKm }));
  },
}));

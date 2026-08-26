import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { darkColors, lightColors, ThemeColors } from "./theme";

export type ThemeMode = "light" | "dark";

const STORAGE_KEY = "garahe.themeMode";

interface ThemeState {
  mode: ThemeMode;
  colors: ThemeColors;
  hydrated: boolean;
  init: () => Promise<void>;
  toggle: () => void;
}

function colorsForMode(mode: ThemeMode): ThemeColors {
  return mode === "light" ? lightColors : darkColors;
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  mode: "dark",
  colors: darkColors,
  hydrated: false,

  init: async () => {
    let mode: ThemeMode = "dark";
    try {
      const saved = await AsyncStorage.getItem(STORAGE_KEY);
      if (saved === "light" || saved === "dark") mode = saved;
    } catch {
      // Fall back to the default dark mode if storage is unavailable.
    }
    set({ mode, colors: colorsForMode(mode), hydrated: true });
  },

  toggle: () => {
    const nextMode: ThemeMode = get().mode === "dark" ? "light" : "dark";
    set({ mode: nextMode, colors: colorsForMode(nextMode) });
    AsyncStorage.setItem(STORAGE_KEY, nextMode).catch(() => {
      // Non-fatal: the toggle still works for this session even if it
      // can't persist.
    });
  },
}));

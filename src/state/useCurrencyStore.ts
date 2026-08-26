import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";

export const CURRENCY_OPTIONS = [
  { code: "PHP", label: "Philippine Peso" },
  { code: "USD", label: "US Dollar" },
  { code: "EUR", label: "Euro" },
  { code: "GBP", label: "British Pound" },
  { code: "JPY", label: "Japanese Yen" },
  { code: "SGD", label: "Singapore Dollar" },
  { code: "AUD", label: "Australian Dollar" },
  { code: "CAD", label: "Canadian Dollar" },
] as const;

export type CurrencyCode = (typeof CURRENCY_OPTIONS)[number]["code"];

const STORAGE_KEY = "garahe-currency";
const DEFAULT_CODE: CurrencyCode = "PHP";

interface CurrencyState {
  code: CurrencyCode;
  hydrated: boolean;
  init: () => Promise<void>;
  setCode: (code: CurrencyCode) => Promise<void>;
}

export const useCurrencyStore = create<CurrencyState>((set) => ({
  code: DEFAULT_CODE,
  hydrated: false,

  init: async () => {
    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    const code = (CURRENCY_OPTIONS.find((c) => c.code === stored)?.code ?? DEFAULT_CODE) as CurrencyCode;
    set({ code, hydrated: true });
  },

  setCode: async (code: CurrencyCode) => {
    set({ code });
    await AsyncStorage.setItem(STORAGE_KEY, code);
  },
}));

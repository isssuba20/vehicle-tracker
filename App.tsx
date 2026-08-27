import "react-native-gesture-handler";
import React, { useEffect } from "react";
import { NavigationContainer, DarkTheme, DefaultTheme } from "@react-navigation/native";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import {
  useFonts as useJetBrainsMono,
  JetBrainsMono_400Regular,
  JetBrainsMono_500Medium,
} from "@expo-google-fonts/jetbrains-mono";
import {
  useFonts as useManrope,
  Manrope_400Regular,
  Manrope_500Medium,
  Manrope_600SemiBold,
} from "@expo-google-fonts/manrope";
import { useFonts as useIconFont } from "expo-font";
import { Ionicons } from "@expo/vector-icons";
import * as Notifications from "expo-notifications";
import { View, ActivityIndicator } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AppGate } from "@/navigation/AppGate";
import { useThemeStore } from "@/theme/useThemeStore";
import { useCurrencyStore } from "@/state/useCurrencyStore";
import { useAppUpdateCheck } from "@/hooks/useAppUpdateCheck";
import { UpdateBanner } from "@/components/UpdateBanner";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export default function App() {
  const [monoLoaded] = useJetBrainsMono({ JetBrainsMono_400Regular, JetBrainsMono_500Medium });
  const [manropeLoaded] = useManrope({ Manrope_400Regular, Manrope_500Medium, Manrope_600SemiBold });
  const [iconsLoaded] = useIconFont(Ionicons.font);

  const { mode, colors, hydrated, init } = useThemeStore();
  const currencyHydrated = useCurrencyStore((s) => s.hydrated);
  const initCurrency = useCurrencyStore((s) => s.init);
  const updateState = useAppUpdateCheck();

  useEffect(() => {
    init();
    initCurrency();
  }, []);

  const fontsReady = monoLoaded && manropeLoaded && iconsLoaded && hydrated && currencyHydrated;

  if (!fontsReady) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.background }}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  const base = mode === "dark" ? DarkTheme : DefaultTheme;
  const navTheme = {
    ...base,
    colors: {
      ...base.colors,
      primary: colors.accent,
      background: colors.background,
      card: colors.background,
      text: colors.textPrimary,
      border: colors.border,
    },
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <UpdateBanner visible={updateState === "ready"} />
        <NavigationContainer theme={navTheme}>
          <StatusBar style={mode === "dark" ? "light" : "dark"} />
          <AppGate />
        </NavigationContainer>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

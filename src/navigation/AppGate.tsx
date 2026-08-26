import React, { useEffect } from "react";
import { View, ActivityIndicator } from "react-native";
import { RootNavigator } from "./RootNavigator";
import { AuthScreen } from "@/screens/AuthScreen";
import { OnboardingScreen } from "@/screens/OnboardingScreen";
import { useAuthStore } from "@/state/authStore";
import { useAppStore } from "@/state/store";
import { useThemeStore } from "@/theme/useThemeStore";
import { isSupabaseConfigured } from "@/data/supabase/client";

function Loading({ background, accent }: { background: string; accent: string }) {
  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: background }}>
      <ActivityIndicator color={accent} />
    </View>
  );
}

/**
 * Decides what to show at the top level: in local (SQLite) mode this is
 * always the tab/stack navigator. Once Supabase is configured, gates on
 * auth session and household membership first — see DECISIONS.md.
 */
export function AppGate() {
  const colors = useThemeStore((s) => s.colors);
  const authInit = useAuthStore((s) => s.init);
  const authInitializing = useAuthStore((s) => s.initializing);
  const session = useAuthStore((s) => s.session);

  const appReady = useAppStore((s) => s.ready);
  const groupIds = useAppStore((s) => s.groupIds);
  const appInit = useAppStore((s) => s.init);
  const appReset = useAppStore((s) => s.reset);

  useEffect(() => {
    authInit();
  }, []);

  const userId = session?.user.id;

  useEffect(() => {
    if (!isSupabaseConfigured) {
      appInit();
      return;
    }
    if (userId) {
      appInit(userId);
    } else {
      appReset();
    }
  }, [userId]);

  if (!isSupabaseConfigured) {
    return <RootNavigator />;
  }

  if (authInitializing) {
    return <Loading background={colors.background} accent={colors.accent} />;
  }

  if (!session) {
    return <AuthScreen />;
  }

  if (!appReady) {
    return <Loading background={colors.background} accent={colors.accent} />;
  }

  if (groupIds.length === 0) {
    return <OnboardingScreen />;
  }

  return <RootNavigator />;
}

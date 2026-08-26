import "react-native-url-polyfill/auto";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";

export const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
export const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

/** Backend is configured only once both env vars are set; otherwise the app falls back to local SQLite. */
export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

/** Deep link the app registers for auth redirects (matches app.json's "scheme"). */
export const AUTH_REDIRECT_URL = "vehicletracker://auth-callback";

export const supabase = isSupabaseConfigured
  ? createClient(SUPABASE_URL as string, SUPABASE_ANON_KEY as string, {
      auth: {
        storage: AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
        // PKCE puts the auth code in a plain query param (?code=...), which
        // survives a mobile deep link intact — the implicit flow's #access_token
        // fragment often doesn't make it through the OS's link handoff.
        flowType: "pkce",
      },
    })
  : null;

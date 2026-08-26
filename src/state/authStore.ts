import { create } from "zustand";
import { Session } from "@supabase/supabase-js";
import { supabase, isSupabaseConfigured, AUTH_REDIRECT_URL } from "@/data/supabase/client";

interface AuthState {
  initializing: boolean;
  session: Session | null;
  init: () => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  /** Completes sign-in from an email confirmation/magic-link deep link (vehicletracker://auth-callback?code=...). */
  handleAuthDeepLink: (url: string) => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  initializing: isSupabaseConfigured,
  session: null,

  init: async () => {
    if (!supabase) {
      set({ initializing: false });
      return;
    }
    const { data } = await supabase.auth.getSession();
    set({ session: data.session, initializing: false });
    supabase.auth.onAuthStateChange((_event, session) => {
      set({ session });
    });
  },

  signUp: async (email: string, password: string) => {
    if (!supabase) throw new Error("Supabase is not configured");
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: AUTH_REDIRECT_URL },
    });
    if (error) throw new Error(error.message);
  },

  signIn: async (email: string, password: string) => {
    if (!supabase) throw new Error("Supabase is not configured");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw new Error(error.message);
  },

  signOut: async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
  },

  handleAuthDeepLink: async (url: string) => {
    if (!supabase || !url.startsWith("vehicletracker://auth-callback")) return;
    // Parsed manually rather than with the URL polyfill — custom (non-http)
    // schemes aren't reliably handled by WHATWG URL parsers in RN.
    const queryString = url.split("?")[1];
    if (!queryString) return;
    const params = new URLSearchParams(queryString);
    const code = params.get("code");
    if (!code) return;
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error && data.session) {
      set({ session: data.session });
    }
  },
}));

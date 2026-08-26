import { create } from "zustand";
import { Session } from "@supabase/supabase-js";
import { supabase, isSupabaseConfigured } from "@/data/supabase/client";

interface AuthState {
  initializing: boolean;
  session: Session | null;
  init: () => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
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
    const { error } = await supabase.auth.signUp({ email, password });
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
}));

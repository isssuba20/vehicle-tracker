import { Repository } from "./repository";
import { SqliteRepository } from "./sqlite/SqliteRepository";
import { SupabaseRepository } from "./supabase/SupabaseRepository";
import { isSupabaseConfigured } from "./supabase/client";

/**
 * Single point of construction for the active Repository implementation.
 * Uses Supabase once EXPO_PUBLIC_SUPABASE_URL/ANON_KEY are set (see
 * supabase/schema.sql); otherwise falls back to local-only SQLite so the
 * app keeps working before the backend is configured.
 */
export function createRepository(): Repository {
  return isSupabaseConfigured ? new SupabaseRepository() : new SqliteRepository();
}

export type { Repository } from "./repository";

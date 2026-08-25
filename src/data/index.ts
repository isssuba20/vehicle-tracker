import { Repository } from "./repository";
import { SqliteRepository } from "./sqlite/SqliteRepository";

/**
 * Single point of construction for the active Repository implementation.
 * Swapping to a Supabase/Firebase-backed Repository later means changing
 * only this file — screens and state depend on the Repository interface.
 */
export function createRepository(): Repository {
  return new SqliteRepository();
}

export type { Repository } from "./repository";

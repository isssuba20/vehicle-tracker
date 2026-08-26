import { Repository } from "@/data/repository";
import {
  Vehicle,
  ServiceLogEntry,
  FuelLogEntry,
  ChargingLogEntry,
  Group,
  GroupMember,
} from "@/types/models";
import { supabase } from "./client";

function client() {
  if (!supabase) throw new Error("Supabase is not configured");
  return supabase;
}

function check<T>(result: { data: T | null; error: { message: string } | null }): T {
  if (result.error) throw new Error(result.error.message);
  return result.data as T;
}

/**
 * Supabase/PostgREST drops `undefined` fields from the request body
 * entirely (JSON.stringify strips them) rather than nulling the column —
 * so clearing an optional field (e.g. removing a vehicle photo) silently
 * no-ops unless it's sent as `null` instead. Model objects use `undefined`
 * for "cleared" throughout the app, so every write goes through this.
 */
function withNulls<T extends object>(obj: T): T {
  const result = { ...obj } as any;
  for (const key in result) {
    if (result[key] === undefined) result[key] = null;
  }
  return result;
}

/**
 * Retries a write without `column` if it fails — covers a brand-new
 * column (e.g. vehicles.primaryDriverUserId) that exists in this app's
 * code before the user has re-run schema.sql on their actual database.
 * Without this, a single unmigrated column would hard-fail every write
 * to that table, not just the field itself.
 */
async function writeWithColumnFallback<T>(
  attempt: (payload: any) => PromiseLike<{ data: T | null; error: { message: string } | null }>,
  payload: any,
  column: string
): Promise<T> {
  let res = await attempt(payload);
  if (res.error) {
    const { [column]: _omit, ...rest } = payload;
    res = await attempt(rest);
  }
  return check(res);
}

/**
 * Supabase-backed Repository. Table columns are quoted camelCase in
 * schema.sql to match these model field names exactly, so rows can be
 * read/written with no per-field mapping.
 */
export class SupabaseRepository implements Repository {
  async getVehicles(groupIds: string[]): Promise<Vehicle[]> {
    if (groupIds.length === 0) return [];
    const res = await client().from("vehicles").select("*").in("groupId", groupIds);
    return check(res) ?? [];
  }

  async getVehicle(id: string): Promise<Vehicle | null> {
    const res = await client().from("vehicles").select("*").eq("id", id).maybeSingle();
    return check(res);
  }

  async createVehicle(vehicle: Vehicle): Promise<void> {
    await writeWithColumnFallback(
      (payload) => client().from("vehicles").insert(payload),
      withNulls(vehicle),
      "primaryDriverUserId"
    );
  }

  async updateVehicle(vehicle: Vehicle): Promise<void> {
    await writeWithColumnFallback(
      (payload) => client().from("vehicles").update(payload).eq("id", vehicle.id),
      withNulls(vehicle),
      "primaryDriverUserId"
    );
  }

  async deleteVehicle(id: string): Promise<void> {
    check(await client().from("vehicles").delete().eq("id", id));
  }

  async getServiceEntries(vehicleId: string): Promise<ServiceLogEntry[]> {
    const res = await client()
      .from("service_entries")
      .select("*")
      .eq("vehicleId", vehicleId)
      .order("date", { ascending: false });
    return check(res) ?? [];
  }

  async addServiceEntry(entry: ServiceLogEntry): Promise<void> {
    check(await client().from("service_entries").insert(withNulls(entry)));
  }

  async updateServiceEntry(entry: ServiceLogEntry): Promise<void> {
    check(await client().from("service_entries").update(withNulls(entry)).eq("id", entry.id));
  }

  async deleteServiceEntry(id: string): Promise<void> {
    check(await client().from("service_entries").delete().eq("id", id));
  }

  async getFuelEntries(vehicleId: string): Promise<FuelLogEntry[]> {
    const res = await client()
      .from("fuel_entries")
      .select("*")
      .eq("vehicleId", vehicleId)
      .order("date", { ascending: false });
    return check(res) ?? [];
  }

  async addFuelEntry(entry: FuelLogEntry): Promise<void> {
    check(await client().from("fuel_entries").insert(withNulls(entry)));
  }

  async updateFuelEntry(entry: FuelLogEntry): Promise<void> {
    check(await client().from("fuel_entries").update(withNulls(entry)).eq("id", entry.id));
  }

  async deleteFuelEntry(id: string): Promise<void> {
    check(await client().from("fuel_entries").delete().eq("id", id));
  }

  async getChargingEntries(vehicleId: string): Promise<ChargingLogEntry[]> {
    const res = await client()
      .from("charging_entries")
      .select("*")
      .eq("vehicleId", vehicleId)
      .order("date", { ascending: false });
    return check(res) ?? [];
  }

  async addChargingEntry(entry: ChargingLogEntry): Promise<void> {
    check(await client().from("charging_entries").insert(withNulls(entry)));
  }

  async updateChargingEntry(entry: ChargingLogEntry): Promise<void> {
    check(await client().from("charging_entries").update(withNulls(entry)).eq("id", entry.id));
  }

  async deleteChargingEntry(id: string): Promise<void> {
    check(await client().from("charging_entries").delete().eq("id", id));
  }

  async getGroups(userId: string): Promise<Group[]> {
    // Falls back to a query without monthlyBudget if that column doesn't
    // exist yet on this project (schema.sql not re-run since it was
    // added) — a hard failure here would leave the whole app stuck on
    // its loading screen, since app init can't proceed without this call.
    let res: any = await client()
      .from("group_members")
      .select('groupId, groups(id, name, monthlyBudget)')
      .eq("userId", userId);
    if (res.error) {
      res = await client().from("group_members").select("groupId, groups(id, name)").eq("userId", userId);
    }
    const rows: any[] = check(res) ?? [];
    return rows
      .map((r: any) => r.groups)
      .filter(Boolean)
      .map((g: any) => ({ id: g.id, name: g.name, monthlyBudget: g.monthlyBudget ?? undefined }));
  }

  async updateGroup(group: Group): Promise<void> {
    await writeWithColumnFallback(
      (payload) => client().from("groups").update(payload).eq("id", group.id),
      withNulls(group),
      "monthlyBudget"
    );
  }

  async getGroupMembers(groupId: string): Promise<GroupMember[]> {
    const res = await client().from("group_members").select("*").eq("groupId", groupId);
    return check(res) ?? [];
  }

  async createGroup(group: Group, owner: GroupMember): Promise<void> {
    check(await client().from("groups").insert(group));
    check(await client().from("group_members").insert(owner));
  }

  async addGroupMember(member: GroupMember): Promise<void> {
    check(await client().from("group_members").insert(member));
  }
}

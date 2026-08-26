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
    check(await client().from("vehicles").insert(vehicle));
  }

  async updateVehicle(vehicle: Vehicle): Promise<void> {
    check(await client().from("vehicles").update(vehicle).eq("id", vehicle.id));
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
    check(await client().from("service_entries").insert(entry));
  }

  async updateServiceEntry(entry: ServiceLogEntry): Promise<void> {
    check(await client().from("service_entries").update(entry).eq("id", entry.id));
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
    check(await client().from("fuel_entries").insert(entry));
  }

  async updateFuelEntry(entry: FuelLogEntry): Promise<void> {
    check(await client().from("fuel_entries").update(entry).eq("id", entry.id));
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
    check(await client().from("charging_entries").insert(entry));
  }

  async updateChargingEntry(entry: ChargingLogEntry): Promise<void> {
    check(await client().from("charging_entries").update(entry).eq("id", entry.id));
  }

  async deleteChargingEntry(id: string): Promise<void> {
    check(await client().from("charging_entries").delete().eq("id", id));
  }

  async getGroups(userId: string): Promise<Group[]> {
    const res = await client()
      .from("group_members")
      .select("groupId, groups(id, name)")
      .eq("userId", userId);
    const rows = check(res) ?? [];
    return rows
      .map((r: any) => r.groups)
      .filter(Boolean)
      .map((g: any) => ({ id: g.id, name: g.name }));
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

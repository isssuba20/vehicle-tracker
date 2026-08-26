import {
  Vehicle,
  ServiceLogEntry,
  FuelLogEntry,
  ChargingLogEntry,
  Group,
  GroupMember,
} from "@/types/models";

/**
 * Storage-agnostic data access contract. Screens depend only on this
 * interface, never on SQLite/Supabase/Firebase specifics, so the v1
 * SQLite implementation can be swapped for a synced backend later
 * without touching UI code.
 */
export interface Repository {
  // Vehicles
  getVehicles(groupIds: string[]): Promise<Vehicle[]>;
  getVehicle(id: string): Promise<Vehicle | null>;
  createVehicle(vehicle: Vehicle): Promise<void>;
  updateVehicle(vehicle: Vehicle): Promise<void>;
  deleteVehicle(id: string): Promise<void>;

  // Service log
  getServiceEntries(vehicleId: string): Promise<ServiceLogEntry[]>;
  addServiceEntry(entry: ServiceLogEntry): Promise<void>;
  updateServiceEntry(entry: ServiceLogEntry): Promise<void>;
  deleteServiceEntry(id: string): Promise<void>;

  // Fuel log
  getFuelEntries(vehicleId: string): Promise<FuelLogEntry[]>;
  addFuelEntry(entry: FuelLogEntry): Promise<void>;
  updateFuelEntry(entry: FuelLogEntry): Promise<void>;
  deleteFuelEntry(id: string): Promise<void>;

  // Charging log (electric/hybrid vehicles)
  getChargingEntries(vehicleId: string): Promise<ChargingLogEntry[]>;
  addChargingEntry(entry: ChargingLogEntry): Promise<void>;
  updateChargingEntry(entry: ChargingLogEntry): Promise<void>;
  deleteChargingEntry(id: string): Promise<void>;

  // Groups / sharing
  getGroups(userId: string): Promise<Group[]>;
  updateGroup(group: Group): Promise<void>;
  getGroupMembers(groupId: string): Promise<GroupMember[]>;
  createGroup(group: Group, owner: GroupMember): Promise<void>;
  addGroupMember(member: GroupMember): Promise<void>;
}

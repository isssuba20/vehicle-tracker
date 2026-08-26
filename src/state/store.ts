import { create } from "zustand";
import uuid from "react-native-uuid";
import { createRepository } from "@/data";
import { isSupabaseConfigured } from "@/data/supabase/client";
import { seedIfEmpty, CURRENT_USER_ID, HOUSEHOLD_GROUP_ID } from "@/data/seed";
import {
  Vehicle,
  ServiceLogEntry,
  FuelLogEntry,
  ChargingLogEntry,
  Group,
  GroupMember,
} from "@/types/models";

const repo = createRepository();

interface AppState {
  ready: boolean;
  currentUserId: string;
  groupIds: string[];
  vehicles: Vehicle[];
  serviceByVehicle: Record<string, ServiceLogEntry[]>;
  fuelByVehicle: Record<string, FuelLogEntry[]>;
  chargingByVehicle: Record<string, ChargingLogEntry[]>;
  members: GroupMember[];

  /** userId is required once a Supabase backend is configured; local SQLite mode ignores it. */
  init: (userId?: string) => Promise<void>;
  reset: () => void;
  refreshGroups: () => Promise<void>;
  refreshVehicles: () => Promise<void>;
  loadVehicleDetail: (vehicleId: string) => Promise<void>;
  loadMembers: (groupId: string) => Promise<void>;

  createHousehold: (name: string, displayName: string) => Promise<void>;
  joinHousehold: (code: string, displayName: string) => Promise<void>;

  addVehicle: (vehicle: Vehicle) => Promise<void>;
  updateVehicle: (vehicle: Vehicle) => Promise<void>;
  deleteVehicle: (vehicleId: string) => Promise<void>;

  addServiceEntry: (entry: ServiceLogEntry) => Promise<void>;
  addFuelEntry: (entry: FuelLogEntry) => Promise<void>;
  addChargingEntry: (entry: ChargingLogEntry) => Promise<void>;

  inviteMember: (groupId: string, displayName: string) => Promise<string>;
}

const emptyState = {
  vehicles: [] as Vehicle[],
  serviceByVehicle: {} as Record<string, ServiceLogEntry[]>,
  fuelByVehicle: {} as Record<string, FuelLogEntry[]>,
  chargingByVehicle: {} as Record<string, ChargingLogEntry[]>,
  members: [] as GroupMember[],
};

export const useAppStore = create<AppState>((set, get) => ({
  ready: false,
  currentUserId: isSupabaseConfigured ? "" : CURRENT_USER_ID,
  groupIds: isSupabaseConfigured ? [] : [HOUSEHOLD_GROUP_ID],
  ...emptyState,

  init: async (userId?: string) => {
    if (isSupabaseConfigured) {
      if (!userId) throw new Error("init() requires userId when Supabase is configured");
      set({ currentUserId: userId });
    } else {
      await seedIfEmpty(repo);
    }
    await get().refreshGroups();
    set({ ready: true });
    await get().refreshVehicles();
  },

  /** Clears app-data state on sign-out so the next signed-in user never sees a stale cache. */
  reset: () => {
    set({ ready: false, currentUserId: "", groupIds: [], ...emptyState });
  },

  refreshGroups: async () => {
    const groups = await repo.getGroups(get().currentUserId);
    set({ groupIds: groups.map((g) => g.id) });
  },

  refreshVehicles: async () => {
    const vehicles = await repo.getVehicles(get().groupIds);
    set({ vehicles });
  },

  loadVehicleDetail: async (vehicleId: string) => {
    const [service, fuel, charging] = await Promise.all([
      repo.getServiceEntries(vehicleId),
      repo.getFuelEntries(vehicleId),
      repo.getChargingEntries(vehicleId),
    ]);
    set((s) => ({
      serviceByVehicle: { ...s.serviceByVehicle, [vehicleId]: service },
      fuelByVehicle: { ...s.fuelByVehicle, [vehicleId]: fuel },
      chargingByVehicle: { ...s.chargingByVehicle, [vehicleId]: charging },
    }));
  },

  loadMembers: async (groupId: string) => {
    const members = await repo.getGroupMembers(groupId);
    set({ members });
  },

  createHousehold: async (name: string, displayName: string) => {
    const group: Group = { id: uuid.v4() as string, name };
    const owner: GroupMember = {
      groupId: group.id,
      userId: get().currentUserId,
      role: "owner",
      displayName,
    };
    await repo.createGroup(group, owner);
    await get().refreshGroups();
    await get().refreshVehicles();
  },

  joinHousehold: async (code: string, displayName: string) => {
    const { redeemInvite } = await import("@/data/supabase/invites");
    await redeemInvite(code, get().currentUserId, displayName);
    await get().refreshGroups();
    await get().refreshVehicles();
  },

  addVehicle: async (vehicle: Vehicle) => {
    await repo.createVehicle(vehicle);
    await get().refreshVehicles();
  },

  updateVehicle: async (vehicle: Vehicle) => {
    await repo.updateVehicle(vehicle);
    await get().refreshVehicles();
  },

  deleteVehicle: async (vehicleId: string) => {
    await repo.deleteVehicle(vehicleId);
    await get().refreshVehicles();
  },

  addServiceEntry: async (entry: ServiceLogEntry) => {
    await repo.addServiceEntry(entry);
    await get().loadVehicleDetail(entry.vehicleId);
    await get().refreshVehicles();
  },

  addFuelEntry: async (entry: FuelLogEntry) => {
    await repo.addFuelEntry(entry);
    await get().loadVehicleDetail(entry.vehicleId);
    await get().refreshVehicles();
  },

  addChargingEntry: async (entry: ChargingLogEntry) => {
    await repo.addChargingEntry(entry);
    await get().loadVehicleDetail(entry.vehicleId);
    await get().refreshVehicles();
  },

  inviteMember: async (groupId: string, displayName: string) => {
    if (isSupabaseConfigured) {
      const { createInvite } = await import("@/data/supabase/invites");
      return createInvite(groupId, get().currentUserId);
    }
    // Local SQLite mode has no real invite mechanism: generate a code and
    // immediately add a placeholder member (see DECISIONS.md).
    const code = Math.random().toString(36).slice(2, 8).toUpperCase();
    const member: GroupMember = {
      groupId,
      userId: `pending-${code}`,
      role: "member",
      displayName,
    };
    await repo.addGroupMember(member);
    await get().loadMembers(groupId);
    return code;
  },
}));

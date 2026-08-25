import { create } from "zustand";
import { createRepository } from "@/data";
import { seedIfEmpty, CURRENT_USER_ID, HOUSEHOLD_GROUP_ID } from "@/data/seed";
import {
  Vehicle,
  ServiceLogEntry,
  FuelLogEntry,
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
  members: GroupMember[];

  init: () => Promise<void>;
  refreshVehicles: () => Promise<void>;
  loadVehicleDetail: (vehicleId: string) => Promise<void>;
  loadMembers: (groupId: string) => Promise<void>;

  addVehicle: (vehicle: Vehicle) => Promise<void>;
  updateVehicle: (vehicle: Vehicle) => Promise<void>;
  deleteVehicle: (vehicleId: string) => Promise<void>;

  addServiceEntry: (entry: ServiceLogEntry) => Promise<void>;
  addFuelEntry: (entry: FuelLogEntry) => Promise<void>;

  inviteMember: (groupId: string, displayName: string) => Promise<string>;
}

export const useAppStore = create<AppState>((set, get) => ({
  ready: false,
  currentUserId: CURRENT_USER_ID,
  groupIds: [HOUSEHOLD_GROUP_ID],
  vehicles: [],
  serviceByVehicle: {},
  fuelByVehicle: {},
  members: [],

  init: async () => {
    await seedIfEmpty(repo);
    const groups = await repo.getGroups(CURRENT_USER_ID);
    const groupIds = groups.map((g) => g.id);
    set({ groupIds, ready: true });
    await get().refreshVehicles();
  },

  refreshVehicles: async () => {
    const vehicles = await repo.getVehicles(get().groupIds);
    set({ vehicles });
  },

  loadVehicleDetail: async (vehicleId: string) => {
    const [service, fuel] = await Promise.all([
      repo.getServiceEntries(vehicleId),
      repo.getFuelEntries(vehicleId),
    ]);
    set((s) => ({
      serviceByVehicle: { ...s.serviceByVehicle, [vehicleId]: service },
      fuelByVehicle: { ...s.fuelByVehicle, [vehicleId]: fuel },
    }));
  },

  loadMembers: async (groupId: string) => {
    const members = await repo.getGroupMembers(groupId);
    set({ members });
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

  inviteMember: async (groupId: string, displayName: string) => {
    // v1 stub: no backend, so "inviting" just generates a shareable code
    // and immediately adds a placeholder member locally. Once a real
    // backend exists this becomes an actual invite flow (see DECISIONS.md).
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

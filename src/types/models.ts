export type Role = "owner" | "member";

export interface Group {
  id: string;
  name: string;
}

export interface GroupMember {
  groupId: string;
  userId: string;
  role: Role;
  displayName: string;
}

export type FuelType = "gas" | "hybrid" | "electric";

export interface Vehicle {
  id: string;
  groupId: string;
  name: string;
  make: string;
  model: string;
  year: number;
  plateNumber: string;
  vin: string;
  color: string;
  purchaseDate: string; // ISO date
  purchasePrice: number;
  currentOdometerKm: number;
  photoUri?: string;
  fuelType: FuelType;

  // Reminder fields
  registrationExpiry: string; // ISO date
  insuranceExpiry: string; // ISO date
  nextPmsDueDate: string; // ISO date
  nextPmsDueKm?: number;

  // EV details — relevant for "hybrid" and "electric"; gas vehicles leave these unset.
  batteryCapacityKwh?: number;
  estimatedRangeKm?: number;
  chargingPortType?: string;
  homeChargingNotes?: string;
}

export interface ServiceLogEntry {
  id: string;
  vehicleId: string;
  date: string; // ISO date
  type: string;
  cost: number;
  shop: string;
  odometerKm: number;
  notes?: string;
}

export interface FuelLogEntry {
  id: string;
  vehicleId: string;
  date: string; // ISO date
  liters: number;
  cost: number;
  odometerKm: number;
}

export interface ChargingLogEntry {
  id: string;
  vehicleId: string;
  date: string; // ISO date
  kwh: number;
  cost: number;
  odometerKm: number;
}

export type Urgency = "ok" | "due_soon" | "overdue";

export interface StatusCluster {
  registration: Urgency;
  insurance: Urgency;
  pms: Urgency;
}

import uuid from "react-native-uuid";
import { Repository } from "@/data/repository";
import { Vehicle, ServiceLogEntry, FuelLogEntry } from "@/types/models";

const CURRENT_USER_ID = "user-1";
const HOUSEHOLD_GROUP_ID = "group-household";

function isoDaysFromNow(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function isoDaysAgo(days: number): string {
  return isoDaysFromNow(-days);
}

/**
 * Seeds mock data on first launch so screens are immediately testable
 * without requiring manual entry. No-ops if data already exists.
 */
export async function seedIfEmpty(repo: Repository): Promise<void> {
  const existing = await repo.getGroups(CURRENT_USER_ID);
  if (existing.length > 0) return;

  await repo.createGroup(
    { id: HOUSEHOLD_GROUP_ID, name: "Suba Household" },
    {
      groupId: HOUSEHOLD_GROUP_ID,
      userId: CURRENT_USER_ID,
      role: "owner",
      displayName: "Melissa",
    }
  );
  await repo.addGroupMember({
    groupId: HOUSEHOLD_GROUP_ID,
    userId: "user-2",
    role: "member",
    displayName: "Kuya Rey",
  });

  const vehicles: Vehicle[] = [
    {
      id: uuid.v4() as string,
      groupId: HOUSEHOLD_GROUP_ID,
      name: "The Beast",
      make: "Toyota",
      model: "Fortuner",
      year: 2021,
      plateNumber: "NAB 1234",
      vin: "JT1234567890ABCDE",
      color: "Silver",
      purchaseDate: "2021-03-15",
      purchasePrice: 1850000,
      currentOdometerKm: 42350,
      fuelType: "gas",
      registrationExpiry: isoDaysFromNow(-5), // overdue
      insuranceExpiry: isoDaysFromNow(20), // due soon
      nextPmsDueDate: isoDaysFromNow(45),
      nextPmsDueKm: 42600, // due soon by km (250km away)
    },
    {
      id: uuid.v4() as string,
      groupId: HOUSEHOLD_GROUP_ID,
      name: "Errand Runner",
      make: "Honda",
      model: "Click 160",
      year: 2023,
      plateNumber: "MC 5678",
      vin: "MH1234567890ABCDE",
      color: "Matte Black",
      purchaseDate: "2023-06-01",
      purchasePrice: 118000,
      currentOdometerKm: 8120,
      fuelType: "gas",
      registrationExpiry: isoDaysFromNow(120),
      insuranceExpiry: isoDaysFromNow(200),
      nextPmsDueDate: isoDaysFromNow(10),
      nextPmsDueKm: 9000,
    },
    {
      id: uuid.v4() as string,
      groupId: HOUSEHOLD_GROUP_ID,
      name: "Weekend Cruiser",
      make: "Mazda",
      model: "3",
      year: 2019,
      plateNumber: "NBC 9012",
      vin: "JM1234567890ABCDE",
      color: "Soul Red",
      purchaseDate: "2019-11-20",
      purchasePrice: 1150000,
      currentOdometerKm: 61200,
      fuelType: "gas",
      registrationExpiry: isoDaysFromNow(300),
      insuranceExpiry: isoDaysFromNow(300),
      nextPmsDueDate: isoDaysFromNow(90),
      nextPmsDueKm: 65000,
    },
  ];

  for (const v of vehicles) {
    await repo.createVehicle(v);
  }

  const [fortuner, click, mazda3] = vehicles;

  const serviceEntries: ServiceLogEntry[] = [
    {
      id: uuid.v4() as string,
      vehicleId: fortuner.id,
      date: isoDaysAgo(60),
      type: "Oil change",
      cost: 3200,
      shop: "Toyota Alabang Service Center",
      odometerKm: 40100,
      notes: "Full synthetic, also replaced oil filter",
    },
    {
      id: uuid.v4() as string,
      vehicleId: fortuner.id,
      date: isoDaysAgo(200),
      type: "Brake pads",
      cost: 5400,
      shop: "Toyota Alabang Service Center",
      odometerKm: 35800,
    },
    {
      id: uuid.v4() as string,
      vehicleId: click.id,
      date: isoDaysAgo(15),
      type: "Oil change",
      cost: 650,
      shop: "Honda Wing Center",
      odometerKm: 8000,
    },
    {
      id: uuid.v4() as string,
      vehicleId: mazda3.id,
      date: isoDaysAgo(90),
      type: "Tire replacement",
      cost: 12800,
      shop: "Bridgestone Molino",
      odometerKm: 59000,
      notes: "All 4 tires, Turanza",
    },
  ];
  for (const e of serviceEntries) {
    await repo.addServiceEntry(e);
  }

  const fuelEntries: FuelLogEntry[] = [
    { id: uuid.v4() as string, vehicleId: fortuner.id, date: isoDaysAgo(30), liters: 45, cost: 3150, odometerKm: 41400 },
    { id: uuid.v4() as string, vehicleId: fortuner.id, date: isoDaysAgo(16), liters: 42, cost: 2940, odometerKm: 41850 },
    { id: uuid.v4() as string, vehicleId: fortuner.id, date: isoDaysAgo(3), liters: 44, cost: 3080, odometerKm: 42350 },
    { id: uuid.v4() as string, vehicleId: click.id, date: isoDaysAgo(20), liters: 4.5, cost: 315, odometerKm: 7940 },
    { id: uuid.v4() as string, vehicleId: click.id, date: isoDaysAgo(6), liters: 4.2, cost: 294, odometerKm: 8120 },
    { id: uuid.v4() as string, vehicleId: mazda3.id, date: isoDaysAgo(40), liters: 38, cost: 2660, odometerKm: 60500 },
    { id: uuid.v4() as string, vehicleId: mazda3.id, date: isoDaysAgo(10), liters: 36, cost: 2520, odometerKm: 61200 },
  ];
  for (const e of fuelEntries) {
    await repo.addFuelEntry(e);
  }
}

export { CURRENT_USER_ID, HOUSEHOLD_GROUP_ID };

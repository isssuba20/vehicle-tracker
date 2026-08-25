import * as SQLite from "expo-sqlite";
import { Repository } from "@/data/repository";
import { openDb } from "./schema";
import {
  Vehicle,
  ServiceLogEntry,
  FuelLogEntry,
  Group,
  GroupMember,
} from "@/types/models";

export class SqliteRepository implements Repository {
  private dbPromise: Promise<SQLite.SQLiteDatabase>;

  constructor() {
    this.dbPromise = openDb();
  }

  private async db() {
    return this.dbPromise;
  }

  async getVehicles(groupIds: string[]): Promise<Vehicle[]> {
    if (groupIds.length === 0) return [];
    const db = await this.db();
    const placeholders = groupIds.map(() => "?").join(",");
    const rows = await db.getAllAsync<Vehicle>(
      `SELECT * FROM vehicles WHERE groupId IN (${placeholders}) ORDER BY name ASC`,
      groupIds
    );
    return rows;
  }

  async getVehicle(id: string): Promise<Vehicle | null> {
    const db = await this.db();
    const row = await db.getFirstAsync<Vehicle>(
      `SELECT * FROM vehicles WHERE id = ?`,
      [id]
    );
    return row ?? null;
  }

  async createVehicle(v: Vehicle): Promise<void> {
    const db = await this.db();
    await db.runAsync(
      `INSERT INTO vehicles
        (id, groupId, name, make, model, year, plateNumber, vin, color,
         purchaseDate, purchasePrice, currentOdometerKm, photoUri,
         registrationExpiry, insuranceExpiry, nextPmsDueDate, nextPmsDueKm)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [
        v.id,
        v.groupId,
        v.name,
        v.make,
        v.model,
        v.year,
        v.plateNumber,
        v.vin,
        v.color,
        v.purchaseDate,
        v.purchasePrice,
        v.currentOdometerKm,
        v.photoUri ?? null,
        v.registrationExpiry,
        v.insuranceExpiry,
        v.nextPmsDueDate,
        v.nextPmsDueKm ?? null,
      ]
    );
  }

  async updateVehicle(v: Vehicle): Promise<void> {
    const db = await this.db();
    await db.runAsync(
      `UPDATE vehicles SET
        groupId=?, name=?, make=?, model=?, year=?, plateNumber=?, vin=?, color=?,
        purchaseDate=?, purchasePrice=?, currentOdometerKm=?, photoUri=?,
        registrationExpiry=?, insuranceExpiry=?, nextPmsDueDate=?, nextPmsDueKm=?
       WHERE id=?`,
      [
        v.groupId,
        v.name,
        v.make,
        v.model,
        v.year,
        v.plateNumber,
        v.vin,
        v.color,
        v.purchaseDate,
        v.purchasePrice,
        v.currentOdometerKm,
        v.photoUri ?? null,
        v.registrationExpiry,
        v.insuranceExpiry,
        v.nextPmsDueDate,
        v.nextPmsDueKm ?? null,
        v.id,
      ]
    );
  }

  async deleteVehicle(id: string): Promise<void> {
    const db = await this.db();
    await db.runAsync(`DELETE FROM vehicles WHERE id = ?`, [id]);
    await db.runAsync(`DELETE FROM service_entries WHERE vehicleId = ?`, [id]);
    await db.runAsync(`DELETE FROM fuel_entries WHERE vehicleId = ?`, [id]);
  }

  async getServiceEntries(vehicleId: string): Promise<ServiceLogEntry[]> {
    const db = await this.db();
    return db.getAllAsync<ServiceLogEntry>(
      `SELECT * FROM service_entries WHERE vehicleId = ? ORDER BY date DESC`,
      [vehicleId]
    );
  }

  async addServiceEntry(e: ServiceLogEntry): Promise<void> {
    const db = await this.db();
    await db.runAsync(
      `INSERT INTO service_entries (id, vehicleId, date, type, cost, shop, odometerKm, notes)
       VALUES (?,?,?,?,?,?,?,?)`,
      [e.id, e.vehicleId, e.date, e.type, e.cost, e.shop, e.odometerKm, e.notes ?? null]
    );
    // Keep the vehicle's live odometer reading in sync with the latest entry.
    await db.runAsync(
      `UPDATE vehicles SET currentOdometerKm = MAX(currentOdometerKm, ?) WHERE id = ?`,
      [e.odometerKm, e.vehicleId]
    );
  }

  async deleteServiceEntry(id: string): Promise<void> {
    const db = await this.db();
    await db.runAsync(`DELETE FROM service_entries WHERE id = ?`, [id]);
  }

  async getFuelEntries(vehicleId: string): Promise<FuelLogEntry[]> {
    const db = await this.db();
    return db.getAllAsync<FuelLogEntry>(
      `SELECT * FROM fuel_entries WHERE vehicleId = ? ORDER BY date DESC`,
      [vehicleId]
    );
  }

  async addFuelEntry(e: FuelLogEntry): Promise<void> {
    const db = await this.db();
    await db.runAsync(
      `INSERT INTO fuel_entries (id, vehicleId, date, liters, cost, odometerKm)
       VALUES (?,?,?,?,?,?)`,
      [e.id, e.vehicleId, e.date, e.liters, e.cost, e.odometerKm]
    );
    await db.runAsync(
      `UPDATE vehicles SET currentOdometerKm = MAX(currentOdometerKm, ?) WHERE id = ?`,
      [e.odometerKm, e.vehicleId]
    );
  }

  async deleteFuelEntry(id: string): Promise<void> {
    const db = await this.db();
    await db.runAsync(`DELETE FROM fuel_entries WHERE id = ?`, [id]);
  }

  async getGroups(userId: string): Promise<Group[]> {
    const db = await this.db();
    return db.getAllAsync<Group>(
      `SELECT g.* FROM groups g
       INNER JOIN group_members m ON m.groupId = g.id
       WHERE m.userId = ?`,
      [userId]
    );
  }

  async getGroupMembers(groupId: string): Promise<GroupMember[]> {
    const db = await this.db();
    return db.getAllAsync<GroupMember>(
      `SELECT * FROM group_members WHERE groupId = ?`,
      [groupId]
    );
  }

  async createGroup(group: Group, owner: GroupMember): Promise<void> {
    const db = await this.db();
    await db.runAsync(`INSERT INTO groups (id, name) VALUES (?, ?)`, [
      group.id,
      group.name,
    ]);
    await this.addGroupMember(owner);
  }

  async addGroupMember(member: GroupMember): Promise<void> {
    const db = await this.db();
    await db.runAsync(
      `INSERT OR REPLACE INTO group_members (groupId, userId, role, displayName) VALUES (?,?,?,?)`,
      [member.groupId, member.userId, member.role, member.displayName]
    );
  }
}

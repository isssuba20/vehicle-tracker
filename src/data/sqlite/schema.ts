import * as SQLite from "expo-sqlite";

async function ensureColumn(
  db: SQLite.SQLiteDatabase,
  table: string,
  column: string,
  definition: string
): Promise<void> {
  const info = await db.getAllAsync<{ name: string }>(`PRAGMA table_info(${table})`);
  if (!info.some((c) => c.name === column)) {
    await db.execAsync(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
  }
}

export async function openDb(): Promise<SQLite.SQLiteDatabase> {
  const db = await SQLite.openDatabaseAsync("vehicle-tracker.db");
  await db.execAsync(`
    PRAGMA journal_mode = WAL;

    CREATE TABLE IF NOT EXISTS groups (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      monthlyBudget REAL
    );

    CREATE TABLE IF NOT EXISTS group_members (
      groupId TEXT NOT NULL,
      userId TEXT NOT NULL,
      role TEXT NOT NULL,
      displayName TEXT NOT NULL,
      PRIMARY KEY (groupId, userId)
    );

    CREATE TABLE IF NOT EXISTS vehicles (
      id TEXT PRIMARY KEY NOT NULL,
      groupId TEXT NOT NULL,
      name TEXT NOT NULL,
      make TEXT NOT NULL,
      model TEXT NOT NULL,
      year INTEGER NOT NULL,
      plateNumber TEXT NOT NULL,
      vin TEXT NOT NULL,
      color TEXT NOT NULL,
      purchaseDate TEXT NOT NULL,
      purchasePrice REAL NOT NULL,
      currentOdometerKm REAL NOT NULL,
      photoUri TEXT,
      fuelType TEXT NOT NULL DEFAULT 'gas',
      batteryCapacityKwh REAL,
      estimatedRangeKm REAL,
      chargingPortType TEXT,
      homeChargingNotes TEXT,
      registrationExpiry TEXT NOT NULL,
      insuranceExpiry TEXT NOT NULL,
      nextPmsDueDate TEXT NOT NULL,
      nextPmsDueKm REAL,
      primaryDriverUserId TEXT
    );

    CREATE TABLE IF NOT EXISTS service_entries (
      id TEXT PRIMARY KEY NOT NULL,
      vehicleId TEXT NOT NULL,
      date TEXT NOT NULL,
      type TEXT NOT NULL,
      cost REAL NOT NULL,
      shop TEXT NOT NULL,
      odometerKm REAL NOT NULL,
      notes TEXT
    );

    CREATE TABLE IF NOT EXISTS fuel_entries (
      id TEXT PRIMARY KEY NOT NULL,
      vehicleId TEXT NOT NULL,
      date TEXT NOT NULL,
      liters REAL NOT NULL,
      cost REAL NOT NULL,
      odometerKm REAL NOT NULL
    );

    CREATE TABLE IF NOT EXISTS charging_entries (
      id TEXT PRIMARY KEY NOT NULL,
      vehicleId TEXT NOT NULL,
      date TEXT NOT NULL,
      kwh REAL NOT NULL,
      cost REAL NOT NULL,
      odometerKm REAL NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_service_vehicle ON service_entries(vehicleId);
    CREATE INDEX IF NOT EXISTS idx_fuel_vehicle ON fuel_entries(vehicleId);
    CREATE INDEX IF NOT EXISTS idx_charging_vehicle ON charging_entries(vehicleId);
    CREATE INDEX IF NOT EXISTS idx_vehicles_group ON vehicles(groupId);
  `);

  // Migration path for installs that already have a vehicles table from
  // before fuelType/EV/photoUri columns existed — CREATE TABLE IF NOT
  // EXISTS above only applies to brand-new databases, so existing local
  // data needs these columns added in place rather than losing it.
  await ensureColumn(db, "vehicles", "photoUri", "TEXT");
  await ensureColumn(db, "vehicles", "fuelType", "TEXT NOT NULL DEFAULT 'gas'");
  await ensureColumn(db, "vehicles", "batteryCapacityKwh", "REAL");
  await ensureColumn(db, "vehicles", "estimatedRangeKm", "REAL");
  await ensureColumn(db, "vehicles", "chargingPortType", "TEXT");
  await ensureColumn(db, "vehicles", "homeChargingNotes", "TEXT");
  await ensureColumn(db, "vehicles", "primaryDriverUserId", "TEXT");
  await ensureColumn(db, "groups", "monthlyBudget", "REAL");

  return db;
}

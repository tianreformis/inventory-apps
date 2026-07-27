import initSqlJs, { Database as SqlJsDatabase } from 'sql.js';
import fs from 'fs';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'data', 'inventory.db');

let db: SqlJsDatabase | null = null;

export async function getDb(): Promise<SqlJsDatabase> {
  if (db) return db;

  const SQL = await initSqlJs();

  if (fs.existsSync(DB_PATH)) {
    const buffer = fs.readFileSync(DB_PATH);
    db = new SQL.Database(buffer);
  } else {
    db = new SQL.Database();
    runAll(db, CREATE_TABLES);
    saveDb();
    const { seedDatabase } = await import('./seed');
    await seedDatabase();
  }

  return db;
}

export function saveDb(): void {
  if (!db) return;
  const data = db.export();
  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
  fs.writeFileSync(DB_PATH, Buffer.from(data));
}

function runAll(database: SqlJsDatabase, sql: string): void {
  database.run(sql);
}

const CREATE_TABLES = `
CREATE TABLE IF NOT EXISTS items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT '',
  satuan TEXT NOT NULL DEFAULT 'unit',
  kode TEXT
);

CREATE TABLE IF NOT EXISTS locations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  description TEXT
);

CREATE TABLE IF NOT EXISTS item_units (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  item_id INTEGER NOT NULL REFERENCES items(id),
  serial_number TEXT,
  label TEXT,
  current_location_id INTEGER REFERENCES locations(id),
  current_condition TEXT NOT NULL DEFAULT 'Baik'
);

CREATE TABLE IF NOT EXISTS stock_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  item_id INTEGER NOT NULL REFERENCES items(id),
  item_unit_id INTEGER REFERENCES item_units(id),
  event_type TEXT NOT NULL CHECK(event_type IN ('initial','transfer','condition_change','writeoff','found','lost')),
  from_location_id INTEGER REFERENCES locations(id),
  to_location_id INTEGER REFERENCES locations(id),
  from_condition TEXT,
  to_condition TEXT,
  quantity INTEGER NOT NULL DEFAULT 1,
  event_date TEXT NOT NULL,
  recorded_by TEXT,
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now','localtime'))
);

CREATE TABLE IF NOT EXISTS maintenance_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  item_id INTEGER NOT NULL REFERENCES items(id),
  item_unit_id INTEGER REFERENCES item_units(id),
  entry_date TEXT NOT NULL,
  completion_date TEXT,
  damage_description TEXT NOT NULL,
  repair_action TEXT,
  technician TEXT,
  cost REAL,
  status TEXT NOT NULL DEFAULT 'menunggu' CHECK(status IN ('menunggu','proses','selesai','tidak_bisa_diperbaiki')),
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now','localtime'))
);

CREATE INDEX IF NOT EXISTS idx_stock_events_item ON stock_events(item_id);
CREATE INDEX IF NOT EXISTS idx_stock_events_date ON stock_events(event_date);
CREATE INDEX IF NOT EXISTS idx_stock_events_type ON stock_events(event_type);
CREATE INDEX IF NOT EXISTS idx_maintenance_item ON maintenance_logs(item_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_status ON maintenance_logs(status);
CREATE INDEX IF NOT EXISTS idx_item_units_item ON item_units(item_id);
`;

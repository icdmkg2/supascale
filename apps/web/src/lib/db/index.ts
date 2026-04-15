import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import * as schema from "./schema";
import path from "path";
import fs from "fs";

let _db: ReturnType<typeof drizzle<typeof schema>> | null = null;
let _sqlite: Database.Database | null = null;

export function getDataDir() {
  const dir = process.env.DATA_DIR || path.join(process.cwd(), "data");
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return dir;
}

export function getDb() {
  if (_db) return _db;
  const file = path.join(getDataDir(), "supascale.db");
  _sqlite = new Database(file);
  _sqlite.pragma("journal_mode = WAL");
  _sqlite.pragma("foreign_keys = ON");
  _db = drizzle(_sqlite, { schema });
  const migrationsFolder = path.join(process.cwd(), "drizzle");
  if (fs.existsSync(migrationsFolder)) {
    migrate(_db, { migrationsFolder });
  }
  return _db;
}

export function getSqliteRaw() {
  getDb();
  return _sqlite!;
}

export function runMigrations() {
  getDb();
}

export { schema };

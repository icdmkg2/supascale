import { desc, eq } from "drizzle-orm";
import { getDb, getSqliteRaw } from "@/lib/db";
import * as schema from "@/lib/db/schema";

export const PROVIDER_KINDS = ["s3", "gcs", "azure", "local"] as const;
export type ProviderKind = (typeof PROVIDER_KINDS)[number];

export function listCloudStorages() {
  const db = getDb();
  return db.select().from(schema.cloudStorage).orderBy(desc(schema.cloudStorage.createdAt)).all();
}

export function getCloudStorage(id: string) {
  const db = getDb();
  return db.select().from(schema.cloudStorage).where(eq(schema.cloudStorage.id, id)).get();
}

export function clearAllDefaultFlags() {
  getSqliteRaw()!.prepare("UPDATE cloud_storage SET is_default = 0").run();
}

export function setStorageDefault(id: string) {
  const db = getDb();
  clearAllDefaultFlags();
  db.update(schema.cloudStorage).set({ isDefault: true }).where(eq(schema.cloudStorage.id, id)).run();
}

export function updateStorageConnectionStatus(id: string, status: "not_tested" | "ok" | "failed") {
  const db = getDb();
  db.update(schema.cloudStorage).set({ connectionStatus: status }).where(eq(schema.cloudStorage.id, id)).run();
}

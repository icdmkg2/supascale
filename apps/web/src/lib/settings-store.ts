import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import * as schema from "@/lib/db/schema";

export function getSetting(key: string): string | null {
  const db = getDb();
  const rows = db
    .select()
    .from(schema.settings)
    .where(eq(schema.settings.key, key))
    .limit(1)
    .all();
  return rows[0]?.value ?? null;
}

export function setSetting(key: string, value: string) {
  const db = getDb();
  db.insert(schema.settings)
    .values({ key, value })
    .onConflictDoUpdate({ target: schema.settings.key, set: { value } })
    .run();
}

export function getSettings(keys: string[]) {
  const db = getDb();
  const rows = db.select().from(schema.settings).all();
  const map = new Map(rows.map((r) => [r.key, r.value]));
  return Object.fromEntries(keys.map((k) => [k, map.get(k) ?? null])) as Record<
    string,
    string | null
  >;
}

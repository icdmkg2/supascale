import { count, eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import * as schema from "@/lib/db/schema";

export function countUsers(): number {
  const db = getDb();
  const row = db.select({ n: count() }).from(schema.users).get();
  return Number(row?.n ?? 0);
}

export function getUserByEmail(email: string) {
  const db = getDb();
  return db.select().from(schema.users).where(eq(schema.users.email, email)).get();
}

export function getUserById(id: string) {
  const db = getDb();
  return db.select().from(schema.users).where(eq(schema.users.id, id)).get();
}

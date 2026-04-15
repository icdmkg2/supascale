import { desc } from "drizzle-orm";
import { getDb } from "@/lib/db";
import * as schema from "@/lib/db/schema";

export function listRecentAuditLogs(limit = 12) {
  const db = getDb();
  return db.select().from(schema.auditLogs).orderBy(desc(schema.auditLogs.createdAt)).limit(limit).all();
}

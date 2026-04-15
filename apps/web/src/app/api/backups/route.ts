import { NextResponse } from "next/server";
import { z } from "zod";
import { nanoid } from "nanoid";
import { requireSession } from "@/lib/auth/guard";
import { getDb } from "@/lib/db";
import * as schema from "@/lib/db/schema";
import { desc } from "drizzle-orm";

export const runtime = "nodejs";

export async function GET() {
  const session = await requireSession();
  if (session instanceof Response) return session;
  const db = getDb();
  const rows = db.select().from(schema.backups).orderBy(desc(schema.backups.createdAt)).all();
  return NextResponse.json({ backups: rows });
}

const bodySchema = z.object({
  projectId: z.string().min(1),
  scheduleCron: z.string().optional().nullable(),
  retentionDays: z.number().int().positive().optional().nullable(),
  storageId: z.string().optional().nullable(),
  enabled: z.boolean().optional().default(true),
});

export async function POST(request: Request) {
  const session = await requireSession();
  if (session instanceof Response) return session;
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const db = getDb();
  const id = nanoid();
  db.insert(schema.backups)
    .values({
      id,
      projectId: parsed.data.projectId,
      scheduleCron: parsed.data.scheduleCron ?? null,
      retentionDays: parsed.data.retentionDays ?? null,
      storageId: parsed.data.storageId ?? null,
      enabled: parsed.data.enabled,
      createdAt: new Date(),
    })
    .run();
  return NextResponse.json({ id });
}

import { NextResponse } from "next/server";
import { z } from "zod";
import { nanoid } from "nanoid";
import { requireSession } from "@/lib/auth/guard";
import { desc } from "drizzle-orm";
import { getDb } from "@/lib/db";
import * as schema from "@/lib/db/schema";
import { encryptSecret } from "@/lib/crypto/secrets";

export const runtime = "nodejs";

export async function GET() {
  const session = await requireSession();
  if (session instanceof Response) return session;
  const db = getDb();
  const rows = db.select().from(schema.cloudStorage).orderBy(desc(schema.cloudStorage.createdAt)).all();
  return NextResponse.json({
    storages: rows.map((r) => ({
      id: r.id,
      name: r.name,
      endpoint: r.endpoint,
      region: r.region,
      bucket: r.bucket,
      useSsl: r.useSsl,
      createdAt: r.createdAt,
    })),
  });
}

const bodySchema = z.object({
  name: z.string().min(1),
  endpoint: z.string().min(1),
  region: z.string().optional().nullable(),
  bucket: z.string().min(1),
  accessKey: z.string().min(1),
  secretKey: z.string().min(1),
  useSsl: z.boolean().optional().default(true),
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
  db.insert(schema.cloudStorage)
    .values({
      id,
      name: parsed.data.name,
      endpoint: parsed.data.endpoint,
      region: parsed.data.region ?? null,
      bucket: parsed.data.bucket,
      accessKeyEnc: encryptSecret(parsed.data.accessKey),
      secretKeyEnc: encryptSecret(parsed.data.secretKey),
      useSsl: parsed.data.useSsl,
      createdAt: new Date(),
    })
    .run();
  return NextResponse.json({ id });
}

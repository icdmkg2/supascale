import { NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { requireSession } from "@/lib/auth/guard";
import { desc } from "drizzle-orm";
import { getDb } from "@/lib/db";
import * as schema from "@/lib/db/schema";
import { createStorageSchema } from "@/server/cloud-storage/create-schema";
import { buildInsertValues } from "@/server/cloud-storage/create-storage";
import { setStorageDefault } from "@/server/cloud-storage/service";

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
      providerKind: r.providerKind,
      isDefault: r.isDefault,
      pathPrefix: r.pathPrefix,
      connectionStatus: r.connectionStatus,
      createdAt: r.createdAt.getTime(),
    })),
  });
}

export async function POST(request: Request) {
  const session = await requireSession();
  if (session instanceof Response) return session;
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = createStorageSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const db = getDb();
  const id = nanoid();
  const v = buildInsertValues(id, parsed.data);
  db.insert(schema.cloudStorage)
    .values({
      id: v.id,
      name: v.name,
      endpoint: v.endpoint,
      region: v.region,
      bucket: v.bucket,
      accessKeyEnc: v.accessKeyEnc,
      secretKeyEnc: v.secretKeyEnc,
      useSsl: v.useSsl,
      providerKind: v.providerKind,
      isDefault: false,
      pathPrefix: v.pathPrefix,
      connectionStatus: "not_tested",
      createdAt: new Date(),
    })
    .run();
  if (v.isDefault) {
    setStorageDefault(id);
  }
  return NextResponse.json({ id });
}

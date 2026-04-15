import { NextResponse } from "next/server";
import { z } from "zod";
import { requireSession } from "@/lib/auth/guard";
import { getCloudStorage, setStorageDefault, updateStorageConnectionStatus } from "@/server/cloud-storage/service";

export const runtime = "nodejs";

type Params = { id: string };

const patchSchema = z
  .object({
    isDefault: z.boolean().optional(),
    connectionStatus: z.enum(["not_tested", "ok", "failed"]).optional(),
  })
  .strict();

export async function PATCH(request: Request, context: { params: Promise<Params> }) {
  const session = await requireSession();
  if (session instanceof Response) return session;
  const { id } = await context.params;
  const row = getCloudStorage(id);
  if (!row) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = patchSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  if (parsed.data.isDefault === true) {
    setStorageDefault(id);
  }
  if (parsed.data.connectionStatus !== undefined) {
    updateStorageConnectionStatus(id, parsed.data.connectionStatus);
  }
  return NextResponse.json({ ok: true });
}

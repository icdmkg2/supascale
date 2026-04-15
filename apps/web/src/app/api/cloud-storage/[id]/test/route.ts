import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth/guard";
import { getCloudStorage, updateStorageConnectionStatus } from "@/server/cloud-storage/service";

export const runtime = "nodejs";

type Params = { id: string };

/** Demo: marks connection as successful without live SDK calls. */
export async function POST(_request: Request, context: { params: Promise<Params> }) {
  const session = await requireSession();
  if (session instanceof Response) return session;
  const { id } = await context.params;
  const row = getCloudStorage(id);
  if (!row) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  updateStorageConnectionStatus(id, "ok");
  return NextResponse.json({ ok: true, message: "Connection test passed (demo)." });
}

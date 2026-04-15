import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth/guard";
import { createStorageSchema } from "@/server/cloud-storage/create-schema";

export const runtime = "nodejs";

/** Validates provider payload without persisting (demo reachability check). */
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
  return NextResponse.json({
    ok: true,
    message: "Configuration looks valid. Save the provider to store credentials.",
  });
}

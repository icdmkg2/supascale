import { NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { z } from "zod";
import { getDb } from "@/lib/db";
import * as schema from "@/lib/db/schema";
import { hashPassword } from "@/lib/auth/password";
import { countUsers } from "@/lib/auth/users";
import { createSessionToken, setSessionCookie } from "@/lib/auth/session";

export const runtime = "nodejs";

const bodySchema = z.object({
  email: z.string().email(),
  password: z.string().min(12),
});

export async function POST(request: Request) {
  if (countUsers() > 0) {
    return NextResponse.json({ error: "Already initialized" }, { status: 400 });
  }
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
  const { email, password } = parsed.data;
  const id = nanoid();
  const passwordHash = await hashPassword(password);
  const db = getDb();
  db.insert(schema.users)
    .values({
      id,
      email,
      passwordHash,
      createdAt: new Date(),
    })
    .run();
  db.insert(schema.auditLogs)
    .values({
      id: nanoid(),
      action: "bootstrap",
      detail: JSON.stringify({ email }),
      userId: id,
      createdAt: new Date(),
    })
    .run();

  const token = await createSessionToken({ sub: id, email });
  await setSessionCookie(token);
  return NextResponse.json({ ok: true });
}

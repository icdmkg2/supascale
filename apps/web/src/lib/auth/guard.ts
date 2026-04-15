import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";

export async function requireSession() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return session;
}

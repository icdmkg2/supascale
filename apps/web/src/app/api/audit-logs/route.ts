import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth/guard";
import { listRecentAuditLogs } from "@/server/audit";

export const runtime = "nodejs";

export async function GET() {
  const session = await requireSession();
  if (session instanceof Response) return session;
  const logs = listRecentAuditLogs(20);
  return NextResponse.json({ logs });
}

import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth/guard";
import { getTaskSchedule, markScheduleRunDemo } from "@/server/task-schedules/service";

export const runtime = "nodejs";

type Params = { id: string };

export async function POST(_request: Request, context: { params: Promise<Params> }) {
  const session = await requireSession();
  if (session instanceof Response) return session;
  const { id } = await context.params;
  const row = getTaskSchedule(id);
  if (!row) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  markScheduleRunDemo(id);
  return NextResponse.json({ ok: true });
}

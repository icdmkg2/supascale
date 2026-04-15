import { NextResponse } from "next/server";
import { z } from "zod";
import { requireSession } from "@/lib/auth/guard";
import { deleteTaskSchedule, getTaskSchedule, updateTaskSchedule } from "@/server/task-schedules/service";

export const runtime = "nodejs";

type Params = { id: string };

const patchSchema = z
  .object({
    name: z.string().min(1).max(200).optional(),
    enabled: z.boolean().optional(),
    scheduleCron: z.string().min(1).optional(),
    timezone: z.string().min(1).optional(),
    config: z.record(z.string(), z.unknown()).nullable().optional(),
  })
  .strict();

export async function PATCH(request: Request, context: { params: Promise<Params> }) {
  const session = await requireSession();
  if (session instanceof Response) return session;
  const { id } = await context.params;
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
  const row = getTaskSchedule(id);
  if (!row) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const ok = updateTaskSchedule(id, parsed.data);
  if (!ok) return NextResponse.json({ error: "Update failed" }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_request: Request, context: { params: Promise<Params> }) {
  const session = await requireSession();
  if (session instanceof Response) return session;
  const { id } = await context.params;
  const row = getTaskSchedule(id);
  if (!row) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  deleteTaskSchedule(id);
  return NextResponse.json({ ok: true });
}

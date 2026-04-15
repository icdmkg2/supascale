import { NextResponse } from "next/server";
import { z } from "zod";
import { requireSession } from "@/lib/auth/guard";
import {
  createTaskSchedule,
  listTaskSchedulesWithProject,
  type TaskScheduleWithProject,
} from "@/server/task-schedules/service";

export const runtime = "nodejs";

const kindSchema = z.enum(["health_check", "container_update", "custom_command", "scheduled_backup"]);

function serializeSchedule(s: TaskScheduleWithProject) {
  return {
    id: s.id,
    projectId: s.projectId,
    projectName: s.projectName,
    name: s.name,
    enabled: s.enabled,
    kind: s.kind,
    scheduleCron: s.scheduleCron,
    timezone: s.timezone,
    config: s.config ? (JSON.parse(s.config) as Record<string, unknown>) : null,
    lastStatus: s.lastStatus,
    lastRunAt: s.lastRunAt ? s.lastRunAt.getTime() : null,
    nextRunAt: s.nextRunAt ? s.nextRunAt.getTime() : null,
    createdAt: s.createdAt.getTime(),
    updatedAt: s.updatedAt.getTime(),
  };
}

export async function GET() {
  const session = await requireSession();
  if (session instanceof Response) return session;
  const rows = listTaskSchedulesWithProject();
  return NextResponse.json({ schedules: rows.map(serializeSchedule) });
}

const createSchema = z.object({
  projectId: z.string().min(1),
  name: z.string().min(1).max(200),
  enabled: z.boolean().optional().default(true),
  kind: kindSchema,
  scheduleCron: z.string().min(1),
  timezone: z.string().min(1).default("UTC"),
  config: z.record(z.string(), z.unknown()).nullable().optional(),
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
  const parsed = createSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const id = createTaskSchedule({
    projectId: parsed.data.projectId,
    name: parsed.data.name,
    enabled: parsed.data.enabled,
    kind: parsed.data.kind,
    scheduleCron: parsed.data.scheduleCron,
    timezone: parsed.data.timezone,
    config: parsed.data.config ?? null,
  });
  return NextResponse.json({ id });
}

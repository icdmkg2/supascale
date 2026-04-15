import { nanoid } from "nanoid";
import { desc, eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import * as schema from "@/lib/db/schema";

export const SCHEDULE_KINDS = [
  "health_check",
  "container_update",
  "custom_command",
  "scheduled_backup",
] as const;
export type ScheduleKind = (typeof SCHEDULE_KINDS)[number];

export type TaskScheduleWithProject = schema.TaskScheduleRow & { projectName: string | null };

export function listTaskSchedulesWithProject(): TaskScheduleWithProject[] {
  const db = getDb();
  const schedules = db
    .select()
    .from(schema.taskSchedules)
    .orderBy(desc(schema.taskSchedules.updatedAt))
    .all();
  const projects = db.select({ id: schema.projects.id, name: schema.projects.name }).from(schema.projects).all();
  const nameById = new Map(projects.map((p) => [p.id, p.name]));
  return schedules.map((s) => ({
    ...s,
    projectName: s.projectId ? nameById.get(s.projectId) ?? null : null,
  }));
}

export function getTaskSchedule(id: string) {
  const db = getDb();
  return db.select().from(schema.taskSchedules).where(eq(schema.taskSchedules.id, id)).get();
}

export function createTaskSchedule(input: {
  projectId: string;
  name: string;
  enabled: boolean;
  kind: ScheduleKind;
  scheduleCron: string;
  timezone: string;
  config: Record<string, unknown> | null;
}) {
  const db = getDb();
  const id = nanoid();
  const now = new Date();
  const nextRunAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  db.insert(schema.taskSchedules)
    .values({
      id,
      projectId: input.projectId,
      name: input.name,
      enabled: input.enabled,
      kind: input.kind,
      scheduleCron: input.scheduleCron,
      timezone: input.timezone,
      config: input.config ? JSON.stringify(input.config) : null,
      lastStatus: null,
      lastRunAt: null,
      nextRunAt,
      createdAt: now,
      updatedAt: now,
    })
    .run();
  return id;
}

export function updateTaskSchedule(
  id: string,
  patch: Partial<{
    name: string;
    enabled: boolean;
    scheduleCron: string;
    timezone: string;
    config: Record<string, unknown> | null;
    lastStatus: string | null;
    lastRunAt: Date | null;
    nextRunAt: Date | null;
  }>,
) {
  const db = getDb();
  const row = getTaskSchedule(id);
  if (!row) return false;
  db.update(schema.taskSchedules)
    .set({
      updatedAt: new Date(),
      ...(patch.name !== undefined ? { name: patch.name } : {}),
      ...(patch.enabled !== undefined ? { enabled: patch.enabled } : {}),
      ...(patch.scheduleCron !== undefined ? { scheduleCron: patch.scheduleCron } : {}),
      ...(patch.timezone !== undefined ? { timezone: patch.timezone } : {}),
      ...(patch.config !== undefined
        ? { config: patch.config ? JSON.stringify(patch.config) : null }
        : {}),
      ...(patch.lastStatus !== undefined ? { lastStatus: patch.lastStatus } : {}),
      ...(patch.lastRunAt !== undefined ? { lastRunAt: patch.lastRunAt } : {}),
      ...(patch.nextRunAt !== undefined ? { nextRunAt: patch.nextRunAt } : {}),
    })
    .where(eq(schema.taskSchedules.id, id))
    .run();
  return true;
}

export function deleteTaskSchedule(id: string) {
  const db = getDb();
  db.delete(schema.taskSchedules).where(eq(schema.taskSchedules.id, id)).run();
}

/** Demo run: records success timestamp (real execution can be wired later). */
export function markScheduleRunDemo(id: string) {
  const now = new Date();
  const nextRunAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  updateTaskSchedule(id, {
    lastRunAt: now,
    lastStatus: "success",
    nextRunAt,
  });
}

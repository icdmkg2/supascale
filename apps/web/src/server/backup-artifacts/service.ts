import { nanoid } from "nanoid";
import { desc, eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import * as schema from "@/lib/db/schema";

export const BACKUP_KINDS = ["full", "database"] as const;
export type BackupKind = (typeof BACKUP_KINDS)[number];

export type BackupArtifactWithProject = schema.BackupArtifactRow & { projectName: string | null };

export function listBackupArtifactsWithProject(): BackupArtifactWithProject[] {
  const db = getDb();
  const rows = db
    .select()
    .from(schema.backupArtifacts)
    .orderBy(desc(schema.backupArtifacts.completedAt))
    .all();
  const projects = db.select({ id: schema.projects.id, name: schema.projects.name }).from(schema.projects).all();
  const nameById = new Map(projects.map((p) => [p.id, p.name]));
  return rows.map((r) => ({
    ...r,
    projectName: nameById.get(r.projectId) ?? null,
  }));
}

export function createBackupArtifact(input: {
  projectId: string;
  name: string | null;
  fileName: string;
  backupKind: BackupKind;
  sizeBytes: number;
  status: string;
  storageDestination: string;
  storageId: string | null;
  scheduleCron: string | null;
  timezone: string | null;
}) {
  const db = getDb();
  const id = nanoid();
  const now = new Date();
  db.insert(schema.backupArtifacts)
    .values({
      id,
      projectId: input.projectId,
      name: input.name,
      fileName: input.fileName,
      backupKind: input.backupKind,
      sizeBytes: input.sizeBytes,
      status: input.status,
      storageDestination: input.storageDestination,
      storageId: input.storageId,
      scheduleCron: input.scheduleCron,
      timezone: input.timezone,
      completedAt: now,
      createdAt: now,
    })
    .run();
  return id;
}

export function getProjectByIdForBackup(projectId: string) {
  const db = getDb();
  return db.select().from(schema.projects).where(eq(schema.projects.id, projectId)).get();
}

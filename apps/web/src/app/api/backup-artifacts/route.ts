import { NextResponse } from "next/server";
import { z } from "zod";
import { requireSession } from "@/lib/auth/guard";
import { getDb } from "@/lib/db";
import * as schema from "@/lib/db/schema";
import {
  createBackupArtifact,
  getProjectByIdForBackup,
  listBackupArtifactsWithProject,
  type BackupArtifactWithProject,
} from "@/server/backup-artifacts/service";

export const runtime = "nodejs";

function serializeRow(r: BackupArtifactWithProject, storageLabel: string | null) {
  return {
    id: r.id,
    projectId: r.projectId,
    projectName: r.projectName,
    name: r.name,
    fileName: r.fileName,
    backupKind: r.backupKind,
    sizeBytes: r.sizeBytes,
    status: r.status,
    storageDestination: r.storageDestination,
    storageId: r.storageId,
    storageLabel,
    scheduleCron: r.scheduleCron,
    timezone: r.timezone,
    completedAt: r.completedAt.getTime(),
    createdAt: r.createdAt.getTime(),
  };
}

export async function GET() {
  const session = await requireSession();
  if (session instanceof Response) return session;
  const rows = listBackupArtifactsWithProject();
  const db = getDb();
  const storages = db.select({ id: schema.cloudStorage.id, name: schema.cloudStorage.name }).from(schema.cloudStorage).all();
  const nameByStorage = new Map(storages.map((s) => [s.id, s.name]));
  const serialized = rows.map((r) => {
    let storageLabel: string | null = null;
    if (r.storageDestination === "cloud") storageLabel = "Cloud";
    else if (r.storageDestination === "local") storageLabel = "Local";
    else if (r.storageDestination === "s3")
      storageLabel = (r.storageId ? nameByStorage.get(r.storageId) : null) ?? "S3";
    return serializeRow(r, storageLabel);
  });
  return NextResponse.json({ artifacts: serialized });
}

const createSchema = z
  .object({
    projectId: z.string().min(1),
    name: z.string().max(200).optional().nullable(),
    backupKind: z.enum(["full", "database"]),
    storageDestination: z.enum(["cloud", "local", "s3"]),
    storageId: z.string().optional().nullable(),
    scheduleCron: z.string().min(1),
    timezone: z.string().min(1).default("UTC"),
  })
  .refine((d) => d.storageDestination !== "s3" || Boolean(d.storageId?.length), {
    message: "Select a cloud storage target",
    path: ["storageId"],
  });

function slugForFile(slug: string) {
  return slug.replace(/[^a-z0-9-]/gi, "").toLowerCase() || "project";
}

function demoSizeBytes(kind: z.infer<typeof createSchema>["backupKind"]): number {
  if (kind === "full") {
    return Math.floor((180 + Math.random() * 120) * 1024 * 1024);
  }
  return Math.floor((8 + Math.random() * 8) * 1024 * 1024);
}

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
  const project = getProjectByIdForBackup(parsed.data.projectId);
  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }
  const base = slugForFile(project.slug);
  const d = new Date();
  const stamp = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
  const fileName = `${base}_backup_${stamp}.tar.gz`;
  const dest =
    parsed.data.storageDestination === "s3" && parsed.data.storageId
      ? "s3"
      : parsed.data.storageDestination;
  const id = createBackupArtifact({
    projectId: parsed.data.projectId,
    name: parsed.data.name?.trim() || null,
    fileName,
    backupKind: parsed.data.backupKind,
    sizeBytes: demoSizeBytes(parsed.data.backupKind),
    status: "completed",
    storageDestination: dest,
    storageId: parsed.data.storageId ?? null,
    scheduleCron: parsed.data.scheduleCron,
    timezone: parsed.data.timezone,
  });
  return NextResponse.json({ id });
}

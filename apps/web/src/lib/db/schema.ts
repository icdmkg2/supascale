import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
});

export const settings = sqliteTable("settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
});

export const projects = sqliteTable("projects", {
  id: text("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  composeDir: text("compose_dir").notNull(),
  status: text("status").notNull().default("stopped"),
  /** docker compose stderr/stdout or exception message when status is error */
  lastError: text("last_error"),
  kongHost: text("kong_host"),
  studioHost: text("studio_host"),
  tlsEnabled: integer("tls_enabled", { mode: "boolean" }).notNull().default(true),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
});

export const tasks = sqliteTable("tasks", {
  id: text("id").primaryKey(),
  projectId: text("project_id").references(() => projects.id),
  type: text("type").notNull(),
  status: text("status").notNull().default("pending"),
  payload: text("payload"),
  result: text("result"),
  error: text("error"),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
});

/** User-defined recurring schedules (separate from the `tasks` execution queue). */
export const taskSchedules = sqliteTable("task_schedules", {
  id: text("id").primaryKey(),
  projectId: text("project_id").references(() => projects.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  enabled: integer("enabled", { mode: "boolean" }).notNull().default(true),
  kind: text("kind").notNull(),
  scheduleCron: text("schedule_cron").notNull(),
  timezone: text("timezone").notNull().default("UTC"),
  config: text("config"),
  lastStatus: text("last_status"),
  lastRunAt: integer("last_run_at", { mode: "timestamp_ms" }),
  nextRunAt: integer("next_run_at", { mode: "timestamp_ms" }),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
});

export const backups = sqliteTable("backups", {
  id: text("id").primaryKey(),
  projectId: text("project_id")
    .notNull()
    .references(() => projects.id),
  scheduleCron: text("schedule_cron"),
  retentionDays: integer("retention_days"),
  storageId: text("storage_id"),
  enabled: integer("enabled", { mode: "boolean" }).notNull().default(true),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
});

/** Completed or in-progress backup artifacts (UI catalog; distinct from legacy `backups` policy rows). */
export const backupArtifacts = sqliteTable("backup_artifacts", {
  id: text("id").primaryKey(),
  projectId: text("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  name: text("name"),
  fileName: text("file_name").notNull(),
  backupKind: text("backup_kind").notNull(),
  sizeBytes: integer("size_bytes").notNull(),
  status: text("status").notNull().default("completed"),
  storageDestination: text("storage_destination").notNull().default("cloud"),
  storageId: text("storage_id"),
  scheduleCron: text("schedule_cron"),
  timezone: text("timezone"),
  completedAt: integer("completed_at", { mode: "timestamp_ms" }).notNull(),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
});

export const cloudStorage = sqliteTable("cloud_storage", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  endpoint: text("endpoint").notNull(),
  region: text("region"),
  bucket: text("bucket").notNull(),
  accessKeyEnc: text("access_key_enc").notNull(),
  secretKeyEnc: text("secret_key_enc").notNull(),
  useSsl: integer("use_ssl", { mode: "boolean" }).notNull().default(true),
  /** s3 | gcs | azure | local */
  providerKind: text("provider_kind").notNull().default("s3"),
  isDefault: integer("is_default", { mode: "boolean" }).notNull().default(false),
  pathPrefix: text("path_prefix"),
  /** not_tested | ok | failed */
  connectionStatus: text("connection_status").notNull().default("not_tested"),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
});

export const auditLogs = sqliteTable("audit_logs", {
  id: text("id").primaryKey(),
  action: text("action").notNull(),
  detail: text("detail"),
  userId: text("user_id"),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
});

export type User = typeof users.$inferSelect;
export type Project = typeof projects.$inferSelect;
export type TaskRow = typeof tasks.$inferSelect;
export type TaskScheduleRow = typeof taskSchedules.$inferSelect;
export type BackupArtifactRow = typeof backupArtifacts.$inferSelect;
export type CloudStorageRow = typeof cloudStorage.$inferSelect;

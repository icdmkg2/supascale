"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Boxes, Cloud, Database, HardDrive, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { SCHEDULE_PRESETS, presetByCron } from "@/lib/task-schedule-presets";
import { cn } from "@/lib/utils";
import type { BackupKind } from "@/server/backup-artifacts/service";

type ProjectRow = { id: string; slug: string; name: string };

type StorageRow = { id: string; name: string };

const KIND_OPTIONS: {
  id: BackupKind;
  title: string;
  description: string;
  Icon: typeof Database;
}[] = [
  {
    id: "full",
    title: "Full Backup",
    description: "Entire Supabase stack: database, storage volumes, and service configuration.",
    Icon: Boxes,
  },
  {
    id: "database",
    title: "Database Backup",
    description: "Postgres logical dump and related metadata only — smaller and faster.",
    Icon: Database,
  },
];

const DEST_OPTIONS: {
  id: "cloud" | "local" | "s3";
  title: string;
  description: string;
  Icon: typeof Cloud;
}[] = [
  {
    id: "cloud",
    title: "Cloud",
    description: "Panel-managed object storage target (default).",
    Icon: Cloud,
  },
  {
    id: "local",
    title: "Local",
    description: "Host filesystem path managed by the panel worker.",
    Icon: HardDrive,
  },
  {
    id: "s3",
    title: "S3-compatible",
    description: "Use a configured bucket from Cloud Storage.",
    Icon: Package,
  },
];

const TIMEZONES = ["UTC", "America/New_York", "Europe/London", "Asia/Tokyo", "Australia/Sydney"];

export function NewBackupClient() {
  const router = useRouter();
  const [projects, setProjects] = React.useState<ProjectRow[]>([]);
  const [storages, setStorages] = React.useState<StorageRow[]>([]);
  const [name, setName] = React.useState("");
  const [projectId, setProjectId] = React.useState("");
  const [backupKind, setBackupKind] = React.useState<BackupKind>("full");
  const [storageDestination, setStorageDestination] = React.useState<"cloud" | "local" | "s3">("cloud");
  const [storageId, setStorageId] = React.useState("");
  const [useCustomCron, setUseCustomCron] = React.useState(false);
  const [cron, setCron] = React.useState("0 3 * * *");
  const [timezone, setTimezone] = React.useState("UTC");
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    void (async () => {
      const [pRes, sRes] = await Promise.all([
        fetch("/api/projects", { credentials: "include" }),
        fetch("/api/cloud-storage", { credentials: "include" }),
      ]);
      if (pRes.ok) {
        const data = (await pRes.json()) as { projects: ProjectRow[] };
        setProjects(data.projects);
        if (data.projects[0]) setProjectId(data.projects[0].id);
      }
      if (sRes.ok) {
        const data = (await sRes.json()) as { storages: StorageRow[] };
        setStorages(data.storages);
        if (data.storages[0]) setStorageId(data.storages[0].id);
      }
    })();
  }, []);

  const selectedPreset = presetByCron(cron);

  function applyPreset(presetCron: string) {
    setCron(presetCron);
    setUseCustomCron(false);
  }

  async function submit() {
    if (!projectId) return;
    if (storageDestination === "s3" && !storageId) return;

    setSaving(true);
    try {
      const res = await fetch("/api/backup-artifacts", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          name: name.trim() || null,
          backupKind,
          storageDestination,
          storageId: storageDestination === "s3" ? storageId : null,
          scheduleCron: cron.trim(),
          timezone,
        }),
      });
      if (res.ok) {
        router.push("/backups");
        router.refresh();
        return;
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <Link
          href="/backups"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" aria-hidden />
          Back
        </Link>
      </div>

      <Card className="border-border bg-card">
        <CardHeader className="pb-4">
          <CardTitle className="text-base">Basic Information</CardTitle>
          <CardDescription>Optional label and which project this backup belongs to.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6 md:grid-cols-2">
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="backup-name">Backup name (optional)</Label>
            <Input
              id="backup-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Weekly production snapshot"
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label>Project</Label>
            <select
              className="h-9 w-full max-w-lg rounded-md border border-input bg-background px-3 text-sm"
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
            >
              <option value="">Select…</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border bg-card">
        <CardHeader className="pb-4">
          <CardTitle className="text-base">Backup Type</CardTitle>
          <CardDescription>Choose the scope of data to include.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2">
            {KIND_OPTIONS.map((opt) => {
              const selected = backupKind === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setBackupKind(opt.id)}
                  className={cn(
                    "flex flex-col items-start gap-3 rounded-xl border p-4 text-left transition-colors",
                    selected
                      ? "border-primary bg-primary/5 shadow-[0_0_0_1px_hsl(var(--primary)/0.35)]"
                      : "border-border bg-background/50 hover:border-border hover:bg-muted/30",
                  )}
                >
                  <span
                    className={cn(
                      "flex size-10 items-center justify-center rounded-lg",
                      selected ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground",
                    )}
                  >
                    <opt.Icon className="size-5" />
                  </span>
                  <div>
                    <p className="font-semibold text-foreground">{opt.title}</p>
                    <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{opt.description}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card className="border-border bg-card">
        <CardHeader className="pb-4">
          <CardTitle className="text-base">Storage Destination</CardTitle>
          <CardDescription>Where completed archives are written.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-3">
            {DEST_OPTIONS.map((opt) => {
              const selected = storageDestination === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setStorageDestination(opt.id)}
                  className={cn(
                    "flex flex-col items-start gap-2 rounded-xl border p-4 text-left text-sm transition-colors",
                    selected
                      ? "border-primary bg-primary/5 shadow-[0_0_0_1px_hsl(var(--primary)/0.35)]"
                      : "border-border bg-background/50 hover:bg-muted/30",
                  )}
                >
                  <span
                    className={cn(
                      "flex size-9 items-center justify-center rounded-lg",
                      selected ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground",
                    )}
                  >
                    <opt.Icon className="size-4" />
                  </span>
                  <p className="font-semibold text-foreground">{opt.title}</p>
                  <p className="text-xs leading-relaxed text-muted-foreground">{opt.description}</p>
                </button>
              );
            })}
          </div>
          {storageDestination === "s3" ? (
            <div className="space-y-2">
              <Label>Cloud storage target</Label>
              <select
                className="h-9 w-full max-w-lg rounded-md border border-input bg-background px-3 text-sm"
                value={storageId}
                onChange={(e) => setStorageId(e.target.value)}
              >
                <option value="">Select bucket…</option>
                {storages.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
              {storages.length === 0 ? (
                <p className="text-xs text-muted-foreground">
                  Add a target under{" "}
                  <Link href="/cloud-storage" className="text-primary underline-offset-4 hover:underline">
                    Cloud Storage
                  </Link>{" "}
                  first.
                </p>
              ) : null}
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Card className="border-border bg-card">
        <CardHeader className="flex flex-col gap-2 pb-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle className="text-base">Schedule</CardTitle>
            <CardDescription>How often this backup runs.</CardDescription>
          </div>
          <div className="flex items-center gap-2 rounded-lg border border-border px-3 py-1.5">
            <span className="text-xs text-muted-foreground">Presets</span>
            <Switch checked={useCustomCron} onCheckedChange={setUseCustomCron} aria-label="Custom cron" />
            <span className="text-xs text-muted-foreground">Custom</span>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {!useCustomCron ? (
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              {SCHEDULE_PRESETS.map((p) => {
                const active = cron === p.cron;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => applyPreset(p.cron)}
                    className={cn(
                      "rounded-lg border px-3 py-2.5 text-left text-sm transition-colors",
                      active
                        ? "border-primary bg-primary/5 font-medium text-primary"
                        : "border-border bg-background/50 text-foreground hover:bg-muted/40",
                    )}
                  >
                    {p.label}
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="cron-custom">Cron expression</Label>
              <Input
                id="cron-custom"
                value={cron}
                onChange={(e) => setCron(e.target.value)}
                placeholder="0 3 * * *"
                className="font-mono text-sm"
              />
            </div>
          )}
          {selectedPreset && !useCustomCron ? (
            <p className="text-xs text-muted-foreground">
              <span className="font-medium text-foreground">{selectedPreset.label}</span>
              {" · "}
              <code className="rounded bg-muted px-1 py-0.5 font-mono text-[11px]">{selectedPreset.cron}</code>
            </p>
          ) : null}
          <div className="space-y-2">
            <Label>Timezone</Label>
            <select
              className="h-9 w-full max-w-md rounded-md border border-input bg-background px-3 text-sm"
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
            >
              {TIMEZONES.map((tz) => (
                <option key={tz} value={tz}>
                  {tz}
                </option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end border-t border-border pt-6">
        <Button
          type="button"
          size="lg"
          className="min-w-[160px]"
          disabled={!projectId || saving || (storageDestination === "s3" && !storageId)}
          onClick={() => void submit()}
        >
          {saving ? "Creating…" : "Create Backup"}
        </Button>
      </div>
    </div>
  );
}

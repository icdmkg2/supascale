"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Database, Heart, RefreshCw, Terminal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { SCHEDULE_PRESETS, presetByCron } from "@/lib/task-schedule-presets";
import { cn } from "@/lib/utils";
import type { ScheduleKind } from "@/server/task-schedules/service";

type ProjectRow = { id: string; slug: string; name: string };

const KIND_OPTIONS: {
  id: ScheduleKind;
  title: string;
  description: string;
  Icon: typeof Heart;
}[] = [
  {
    id: "health_check",
    title: "Health Check",
    description: "Monitor endpoint health and automatically restart unhealthy containers.",
    Icon: Heart,
  },
  {
    id: "container_update",
    title: "Container Update",
    description: "Automatically pull and update containers to latest.",
    Icon: RefreshCw,
  },
  {
    id: "custom_command",
    title: "Custom Command",
    description: "Run custom commands inside container environments.",
    Icon: Terminal,
  },
  {
    id: "scheduled_backup",
    title: "Scheduled Backups",
    description: "Automatically backup database, storage functions or config.",
    Icon: Database,
  },
];

const TIMEZONES = ["UTC", "America/New_York", "Europe/London", "Asia/Tokyo", "Australia/Sydney"];

export function NewTaskClient() {
  const router = useRouter();
  const [projects, setProjects] = React.useState<ProjectRow[]>([]);
  const [name, setName] = React.useState("Daily Health Check");
  const [projectId, setProjectId] = React.useState("");
  const [enabled, setEnabled] = React.useState(true);
  const [kind, setKind] = React.useState<ScheduleKind>("health_check");
  const [useCustomCron, setUseCustomCron] = React.useState(false);
  const [cron, setCron] = React.useState("0 0 * * *");
  const [timezone, setTimezone] = React.useState("UTC");
  const [autoRestart, setAutoRestart] = React.useState(false);
  const [notifyOnFailure, setNotifyOnFailure] = React.useState(true);
  const [httpEndpoint, setHttpEndpoint] = React.useState("/health or /api/health");
  const [timeoutSeconds, setTimeoutSeconds] = React.useState("30");
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    void (async () => {
      const res = await fetch("/api/projects", { credentials: "include" });
      if (!res.ok) return;
      const data = (await res.json()) as { projects: ProjectRow[] };
      setProjects(data.projects);
      if (data.projects[0]) setProjectId(data.projects[0].id);
    })();
  }, []);

  const selectedPreset = presetByCron(cron);

  function applyPreset(presetCron: string) {
    setCron(presetCron);
    setUseCustomCron(false);
  }

  async function submit() {
    if (!projectId) return;
    const timeout = Number.parseInt(timeoutSeconds, 10);
    const config: Record<string, unknown> =
      kind === "health_check"
        ? {
            autoRestartOnFailure: autoRestart,
            notifyOnFailure: notifyOnFailure,
            httpEndpoint: httpEndpoint.trim() || undefined,
            timeoutSeconds: Number.isFinite(timeout) ? timeout : 30,
          }
        : {};

    setSaving(true);
    try {
      const res = await fetch("/api/task-schedules", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          name: name.trim() || "Task",
          enabled,
          kind,
          scheduleCron: cron.trim(),
          timezone,
          config: Object.keys(config).length ? config : null,
        }),
      });
      if (res.ok) {
        router.push("/tasks");
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
          href="/tasks"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" aria-hidden />
          Back
        </Link>
      </div>

      <Card className="border-border bg-card">
        <CardHeader className="pb-4">
          <CardTitle className="text-base">Basic Information</CardTitle>
          <CardDescription>Name, project, and whether this schedule is enabled.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6 md:grid-cols-[1fr_1fr_auto] md:items-end">
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="task-name">Task Name</Label>
            <Input id="task-name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Project</Label>
            <select
              className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
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
          <div className="flex flex-col gap-2 md:items-end">
            <Label htmlFor="task-enabled" className="md:text-right">
              Enabled
            </Label>
            <Switch id="task-enabled" checked={enabled} onCheckedChange={setEnabled} />
          </div>
        </CardContent>
      </Card>

      <Card className="border-border bg-card">
        <CardHeader className="pb-4">
          <CardTitle className="text-base">Task Type</CardTitle>
          <CardDescription>Choose what this schedule runs.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {KIND_OPTIONS.map((opt) => {
              const selected = kind === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setKind(opt.id)}
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
        <CardHeader className="flex flex-col gap-2 pb-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle className="text-base">Schedule</CardTitle>
            <CardDescription>How often this task runs.</CardDescription>
          </div>
          <div className="flex items-center gap-2 rounded-lg border border-border px-3 py-1.5">
            <span className="text-xs text-muted-foreground">Presets</span>
            <Switch checked={useCustomCron} onCheckedChange={setUseCustomCron} aria-label="Use custom cron" />
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
                placeholder="0 0 * * *"
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

      {kind === "health_check" ? (
        <Card className="border-border bg-card">
          <CardHeader className="pb-4">
            <CardTitle className="text-base">Health Check Configuration</CardTitle>
            <CardDescription>Endpoint checks and failure handling.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-6 md:grid-cols-2">
            <div className="flex items-center justify-between gap-4 rounded-lg border border-border/80 px-4 py-3">
              <div>
                <p className="text-sm font-medium">Auto-restart on failure</p>
                <p className="text-xs text-muted-foreground">Restart containers when checks fail.</p>
              </div>
              <Switch checked={autoRestart} onCheckedChange={setAutoRestart} />
            </div>
            <div className="flex items-center justify-between gap-4 rounded-lg border border-border/80 px-4 py-3">
              <div>
                <p className="text-sm font-medium">Notify on failure</p>
                <p className="text-xs text-muted-foreground">Send alerts when unhealthy.</p>
              </div>
              <Switch checked={notifyOnFailure} onCheckedChange={setNotifyOnFailure} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="http-endpoint">HTTP Endpoint (optional)</Label>
              <Input
                id="http-endpoint"
                value={httpEndpoint}
                onChange={(e) => setHttpEndpoint(e.target.value)}
                placeholder="/health"
              />
              <p className="text-xs text-muted-foreground">
                Relative path checked against your project&apos;s edge URL when execution is wired.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="timeout">Timeout (seconds)</Label>
              <Input
                id="timeout"
                value={timeoutSeconds}
                onChange={(e) => setTimeoutSeconds(e.target.value)}
                inputMode="numeric"
              />
            </div>
          </CardContent>
        </Card>
      ) : null}

      <div className="flex justify-end border-t border-border pt-6">
        <Button type="button" size="lg" className="min-w-[160px]" disabled={!projectId || saving} onClick={() => void submit()}>
          {saving ? "Creating…" : "Create Task"}
        </Button>
      </div>
    </div>
  );
}

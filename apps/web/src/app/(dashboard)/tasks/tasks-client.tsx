"use client";

import * as React from "react";
import Link from "next/link";
import {
  CalendarClock,
  Database,
  Heart,
  ListTodo,
  Play,
  RefreshCw,
  Terminal,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import type { ScheduleKind } from "@/server/task-schedules/service";

export type TaskScheduleDto = {
  id: string;
  projectId: string | null;
  projectName: string | null;
  name: string;
  enabled: boolean;
  kind: string;
  scheduleCron: string;
  timezone: string;
  config: Record<string, unknown> | null;
  lastStatus: string | null;
  lastRunAt: number | null;
  nextRunAt: number | null;
};

const KIND_LABEL: Record<ScheduleKind, string> = {
  health_check: "Health Check",
  container_update: "Container Update",
  custom_command: "Custom Command",
  scheduled_backup: "Backup",
};

function kindIcon(kind: string) {
  switch (kind) {
    case "health_check":
      return Heart;
    case "container_update":
      return RefreshCw;
    case "custom_command":
      return Terminal;
    case "scheduled_backup":
      return Database;
    default:
      return ListTodo;
  }
}

function kindIconStyles(kind: string) {
  switch (kind) {
    case "health_check":
      return "bg-rose-500/15 text-rose-400";
    case "container_update":
      return "bg-sky-500/15 text-sky-400";
    case "custom_command":
      return "bg-amber-500/15 text-amber-400";
    case "scheduled_backup":
      return "bg-blue-500/15 text-blue-400";
    default:
      return "bg-muted text-muted-foreground";
  }
}

function formatWhen(ts: number | null) {
  if (ts == null) return "—";
  return new Date(ts).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

export function TasksClient() {
  const [schedules, setSchedules] = React.useState<TaskScheduleDto[]>([]);

  async function refresh() {
    const res = await fetch("/api/task-schedules", { credentials: "include" });
    if (!res.ok) return;
    const data = (await res.json()) as { schedules: TaskScheduleDto[] };
    setSchedules(data.schedules);
  }

  React.useEffect(() => {
    void refresh();
    const id = window.setInterval(() => void refresh(), 8000);
    return () => window.clearInterval(id);
  }, []);

  const activeCount = schedules.length;
  const healthCount = schedules.filter((s) => s.kind === "health_check").length;
  const containerCount = schedules.filter((s) => s.kind === "container_update").length;
  const customCount = schedules.filter((s) => s.kind === "custom_command").length;

  async function setEnabled(id: string, enabled: boolean) {
    setSchedules((prev) => prev.map((s) => (s.id === id ? { ...s, enabled } : s)));
    const res = await fetch(`/api/task-schedules/${id}`, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ enabled }),
    });
    if (!res.ok) void refresh();
  }

  async function runNow(id: string) {
    const res = await fetch(`/api/task-schedules/${id}/run`, {
      method: "POST",
      credentials: "include",
    });
    if (res.ok) void refresh();
  }

  const stats = [
    { label: "Active Tasks", value: activeCount, icon: ListTodo },
    { label: "Health Checks", value: healthCount, icon: Heart },
    { label: "Container Updates", value: containerCount, icon: RefreshCw },
    { label: "Custom Commands", value: customCount, icon: Terminal },
  ];

  return (
    <div className="space-y-8">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label} className="border-border/80 bg-card/80">
            <CardContent className="flex items-center gap-4 p-5">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <s.icon className="size-5" aria-hidden />
              </span>
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{s.label}</p>
                <p className="text-2xl font-semibold tabular-nums text-foreground">{s.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="space-y-3">
        {schedules.length === 0 ? (
          <Card className="border-dashed border-border bg-card/50">
            <CardContent className="py-12 text-center text-sm text-muted-foreground">
              No scheduled tasks yet.{" "}
              <Link href="/tasks/new" className="font-medium text-primary underline-offset-4 hover:underline">
                Create one
              </Link>
            </CardContent>
          </Card>
        ) : (
          schedules.map((t) => {
            const Icon = kindIcon(t.kind);
            const status =
              t.lastStatus === "success"
                ? "Success"
                : t.lastStatus === "failed"
                  ? "Failed"
                  : "Pending";
            const subtitle = `${t.projectName ?? "Project"} + ${KIND_LABEL[t.kind as ScheduleKind] ?? t.kind}`;
            return (
              <div
                key={t.id}
                className="flex flex-col gap-4 rounded-xl border border-border/80 bg-card/90 p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex min-w-0 flex-1 gap-4">
                  <span
                    className={cn(
                      "flex size-11 shrink-0 items-center justify-center rounded-lg",
                      kindIconStyles(t.kind),
                    )}
                  >
                    <Icon className="size-5" aria-hidden />
                  </span>
                  <div className="min-w-0 flex-1 space-y-1">
                    <p className="truncate font-semibold text-foreground">{t.name}</p>
                    <p className="truncate text-sm text-muted-foreground">{subtitle}</p>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1.5">
                        <CalendarClock className="size-3.5 shrink-0 opacity-70" aria-hidden />
                        Last: {formatWhen(t.lastRunAt)}
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <CalendarClock className="size-3.5 shrink-0 opacity-70" aria-hidden />
                        Next: {formatWhen(t.nextRunAt)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex shrink-0 flex-wrap items-center justify-end gap-3 sm:pl-2">
                  <span
                    className={cn(
                      "rounded-full border px-2.5 py-0.5 text-xs font-medium",
                      status === "Success" && "border-primary/50 text-primary",
                      status === "Failed" && "border-destructive/50 text-destructive",
                      status === "Pending" && "border-border text-muted-foreground",
                    )}
                  >
                    {status}
                  </span>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={t.enabled}
                      onCheckedChange={(v) => void setEnabled(t.id, v)}
                      aria-label={`Enable ${t.name}`}
                    />
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="h-9 w-9 text-foreground"
                      onClick={() => void runNow(t.id)}
                      aria-label={`Run ${t.name} now`}
                    >
                      <Play className="size-4 fill-current" />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

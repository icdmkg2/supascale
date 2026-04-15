"use client";

import * as React from "react";
import Link from "next/link";
import {
  Boxes,
  CalendarClock,
  CheckCircle2,
  Cloud,
  Database,
  Trash2,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export type BackupArtifactDto = {
  id: string;
  projectId: string;
  projectName: string | null;
  name: string | null;
  fileName: string;
  backupKind: string;
  sizeBytes: number;
  status: string;
  storageDestination: string;
  storageId: string | null;
  storageLabel: string | null;
  completedAt: number;
  createdAt: number;
};

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  const kb = n / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  const mb = kb / 1024;
  if (mb < 1024) return `${mb.toFixed(2)} MB`;
  const gb = mb / 1024;
  return `${gb.toFixed(2)} GB`;
}

function formatShortDate(ts: number) {
  return new Date(ts).toLocaleDateString(undefined, {
    year: "numeric",
    month: "numeric",
    day: "numeric",
  });
}

const KIND_LABEL: Record<string, string> = {
  full: "Full Backup",
  database: "Database Backup",
};

export function BackupsClient() {
  const [rows, setRows] = React.useState<BackupArtifactDto[]>([]);

  async function refresh() {
    const res = await fetch("/api/backup-artifacts", { credentials: "include" });
    if (!res.ok) return;
    const data = (await res.json()) as { artifacts: BackupArtifactDto[] };
    setRows(data.artifacts);
  }

  React.useEffect(() => {
    void refresh();
    const id = window.setInterval(() => void refresh(), 12000);
    return () => window.clearInterval(id);
  }, []);

  const totalBytes = rows.reduce((acc, r) => acc + r.sizeBytes, 0);
  const fullCount = rows.filter((r) => r.backupKind === "full").length;
  const databaseCount = rows.filter((r) => r.backupKind === "database").length;
  const completedCount = rows.filter((r) => r.status === "completed").length;

  const stats = [
    {
      label: "Total Backups",
      value: rows.length,
      sub: formatBytes(totalBytes),
      icon: Trash2,
      iconClass: "bg-primary/15 text-primary",
    },
    {
      label: "Full Backups",
      value: fullCount,
      sub: null as string | null,
      icon: Boxes,
      iconClass: "bg-sky-500/15 text-sky-400",
    },
    {
      label: "Database Backups",
      value: databaseCount,
      sub: null as string | null,
      icon: Database,
      iconClass: "bg-primary/15 text-primary",
    },
    {
      label: "Completed",
      value: completedCount,
      sub: null as string | null,
      icon: CheckCircle2,
      iconClass: "bg-primary/15 text-primary",
    },
  ];

  return (
    <div className="space-y-8">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label} className="border-border/80 bg-card/80">
            <CardContent className="flex items-center gap-4 p-5">
              <span className={cn("flex size-11 shrink-0 items-center justify-center rounded-xl", s.iconClass)}>
                <s.icon className="size-5" aria-hidden />
              </span>
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{s.label}</p>
                <p className="text-2xl font-semibold tabular-nums text-foreground">{s.value}</p>
                {s.sub ? <p className="text-xs text-muted-foreground">{s.sub}</p> : null}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="space-y-3">
        {rows.length === 0 ? (
          <Card className="border-dashed border-border bg-card/50">
            <CardContent className="py-12 text-center text-sm text-muted-foreground">
              No backups yet.{" "}
              <Link href="/backups/new" className="font-medium text-primary underline-offset-4 hover:underline">
                Create one
              </Link>
            </CardContent>
          </Card>
        ) : (
          rows.map((b) => {
            const metaParts = [
              b.projectName ?? "Project",
              KIND_LABEL[b.backupKind] ?? b.backupKind,
              formatBytes(b.sizeBytes),
            ];
            return (
              <div
                key={b.id}
                className="flex flex-col gap-4 rounded-xl border border-border/80 bg-card/90 p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex min-w-0 flex-1 gap-4">
                  <span className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">
                    <Trash2 className="size-5" aria-hidden />
                  </span>
                  <div className="min-w-0 flex-1 space-y-1">
                    <p className="truncate font-mono text-sm font-semibold text-foreground">{b.fileName}</p>
                    <p className="truncate text-sm text-muted-foreground">{metaParts.join(" • ")}</p>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1.5">
                        <CalendarClock className="size-3.5 shrink-0 opacity-70" aria-hidden />
                        {formatShortDate(b.completedAt)}
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <Cloud className="size-3.5 shrink-0 opacity-70" aria-hidden />
                        {b.storageLabel ?? b.storageDestination}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex shrink-0 items-center justify-end sm:pl-2">
                  <span
                    className={cn(
                      "rounded-full border px-2.5 py-0.5 text-xs font-medium",
                      b.status === "completed" && "border-primary/50 text-primary",
                      b.status !== "completed" && "border-border text-muted-foreground",
                    )}
                  >
                    {b.status === "completed" ? "Completed" : b.status}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

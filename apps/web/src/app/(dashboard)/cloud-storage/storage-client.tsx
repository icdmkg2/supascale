"use client";

import * as React from "react";
import Link from "next/link";
import {
  ChevronRight,
  Cloud,
  Database,
  HardDrive,
  Star,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { providerLineLabel } from "@/lib/cloud-storage-display";

export type StorageRowDto = {
  id: string;
  name: string;
  endpoint: string;
  region: string | null;
  bucket: string;
  useSsl: boolean;
  providerKind: string;
  isDefault: boolean;
  pathPrefix: string | null;
  connectionStatus: string;
  createdAt: number;
};

function kindIcon(kind: string) {
  switch (kind) {
    case "s3":
      return Cloud;
    case "gcs":
      return Database;
    case "azure":
      return Cloud;
    case "local":
      return HardDrive;
    default:
      return Cloud;
  }
}

function kindIconClass(kind: string) {
  switch (kind) {
    case "s3":
      return "bg-primary/15 text-primary";
    case "gcs":
      return "bg-primary/15 text-primary";
    case "azure":
      return "bg-sky-500/15 text-sky-400";
    case "local":
      return "bg-muted text-muted-foreground";
    default:
      return "bg-muted text-muted-foreground";
  }
}

function statusLabel(s: string) {
  switch (s) {
    case "ok":
      return "Connected";
    case "failed":
      return "Failed";
    default:
      return "Not tested";
  }
}

export function StorageClient() {
  const [rows, setRows] = React.useState<StorageRowDto[]>([]);

  async function refresh() {
    const res = await fetch("/api/cloud-storage", { credentials: "include" });
    if (!res.ok) return;
    const data = (await res.json()) as { storages: StorageRowDto[] };
    setRows(data.storages);
  }

  React.useEffect(() => {
    void refresh();
    const id = window.setInterval(() => void refresh(), 15000);
    return () => window.clearInterval(id);
  }, []);

  const total = rows.length;
  const s3Count = rows.filter((r) => r.providerKind === "s3").length;
  const gcsCount = rows.filter((r) => r.providerKind === "gcs").length;

  async function setDefault(id: string, e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    await fetch(`/api/cloud-storage/${id}`, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isDefault: true }),
    });
    void refresh();
  }

  const stats = [
    { label: "Total", value: total, icon: Cloud, iconClass: "bg-primary/15 text-primary" },
    {
      label: "S3-compatible",
      value: s3Count,
      icon: Cloud,
      iconClass: "bg-sky-500/15 text-sky-400",
    },
    {
      label: "Google Cloud",
      value: gcsCount,
      icon: Database,
      iconClass: "bg-primary/15 text-primary",
    },
  ];

  return (
    <div className="space-y-8">
      <div className="grid gap-4 sm:grid-cols-3">
        {stats.map((s) => (
          <Card key={s.label} className="border-border/80 bg-card/80">
            <CardContent className="flex items-center gap-4 p-5">
              <span
                className={cn(
                  "flex size-11 shrink-0 items-center justify-center rounded-xl",
                  s.iconClass,
                )}
              >
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
        {rows.length === 0 ? (
          <Card className="border-dashed border-border bg-card/50">
            <CardContent className="py-12 text-center text-sm text-muted-foreground">
              No storage providers yet.{" "}
              <Link href="/cloud-storage/new" className="font-medium text-primary underline-offset-4 hover:underline">
                Add one
              </Link>
            </CardContent>
          </Card>
        ) : (
          rows.map((r) => {
            const Icon = kindIcon(r.providerKind);
            const line = `${providerLineLabel(r.providerKind)} • ${r.bucket}`;
            return (
              <div
                key={r.id}
                className="flex flex-col gap-3 rounded-xl border border-border/80 bg-card/90 p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex min-w-0 flex-1 gap-4">
                  <span
                    className={cn(
                      "flex size-11 shrink-0 items-center justify-center rounded-lg",
                      kindIconClass(r.providerKind),
                    )}
                  >
                    <Icon className="size-5" aria-hidden />
                  </span>
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold text-foreground">{r.name}</p>
                      {r.isDefault ? (
                        <span className="rounded-md border border-sky-500/40 bg-sky-500/10 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-sky-400">
                          Default
                        </span>
                      ) : null}
                    </div>
                    <p className="truncate text-sm text-muted-foreground">{line}</p>
                  </div>
                </div>

                <div className="flex shrink-0 flex-wrap items-center justify-end gap-2 sm:gap-3">
                  <span
                    className={cn(
                      "rounded-full border px-2.5 py-0.5 text-xs font-medium",
                      r.connectionStatus === "ok" && "border-primary/50 text-primary",
                      r.connectionStatus === "failed" && "border-destructive/50 text-destructive",
                      (r.connectionStatus === "not_tested" || !r.connectionStatus) &&
                        "border-border text-muted-foreground",
                    )}
                  >
                    {statusLabel(r.connectionStatus)}
                  </span>
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className={cn("h-9 w-9", r.isDefault && "text-primary")}
                    aria-label={r.isDefault ? "Default provider" : "Set as default"}
                    onClick={(e) => void setDefault(r.id, e)}
                  >
                    <Star className={cn("size-4", r.isDefault && "fill-current")} />
                  </Button>
                  <ChevronRight className="size-5 shrink-0 text-muted-foreground opacity-60" aria-hidden />
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

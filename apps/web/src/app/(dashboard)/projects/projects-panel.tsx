"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Loader2,
  MoreVertical,
  Play,
  Plus,
  Server,
  Square,
  Trash2,
} from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { ProjectCreateWizard } from "./project-create-wizard";

type ProjectRow = {
  id: string;
  slug: string;
  name: string;
  status: string;
  lastError: string | null;
  kongHost: string | null;
  studioHost: string | null;
  tlsEnabled: boolean;
};

function apiDisplay(kong: string | null): string {
  if (!kong?.trim()) return "—";
  const s = kong.trim();
  try {
    const withProto = s.includes("://") ? s : `https://${s}`;
    const u = new URL(withProto);
    const port = u.port;
    if (port) return port;
    return u.hostname.length > 28 ? `${u.hostname.slice(0, 26)}…` : u.hostname;
  } catch {
    return s.length > 28 ? `${s.slice(0, 26)}…` : s;
  }
}

export function ProjectsPanel() {
  const router = useRouter();
  const [rows, setRows] = React.useState<ProjectRow[]>([]);
  const [removingSlug, setRemovingSlug] = React.useState<string | null>(null);
  const [wizardOpen, setWizardOpen] = React.useState(false);

  async function refresh() {
    const res = await fetch("/api/projects", { credentials: "include" });
    if (!res.ok) return;
    const data = (await res.json()) as { projects: ProjectRow[] };
    setRows(data.projects);
  }

  React.useEffect(() => {
    void refresh();
  }, []);

  async function start(slug: string) {
    await fetch(`/api/projects/${encodeURIComponent(slug)}/start`, {
      method: "POST",
      credentials: "include",
    });
    await refresh();
  }

  async function stop(slug: string) {
    await fetch(`/api/projects/${encodeURIComponent(slug)}/stop`, {
      method: "POST",
      credentials: "include",
    });
    await refresh();
  }

  async function removeStack(p: ProjectRow) {
    const confirmed = window.confirm(
      `Remove stack "${p.name}" (${p.slug})?\n\nThis runs docker compose down, deletes the project folder under PROJECTS_ROOT (including database volumes), and removes backups/tasks linked to this project in the panel database. This cannot be undone.`,
    );
    if (!confirmed) return;
    setRemovingSlug(p.slug);
    try {
      const res = await fetch(`/api/projects/${encodeURIComponent(p.slug)}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) {
        const j = (await res.json().catch(() => null)) as { error?: string };
        window.alert(j?.error ?? "Remove failed");
        return;
      }
      await refresh();
    } finally {
      setRemovingSlug(null);
    }
  }

  return (
    <>
      <AppShell
        title="Projects"
        subtitle="Manage your Supabase instances."
        breadcrumb="Projects"
        headerActions={
          <Button
            type="button"
            size="sm"
            className="bg-emerald-600 text-white hover:bg-emerald-500 dark:bg-emerald-600 dark:hover:bg-emerald-500"
            onClick={() => setWizardOpen(true)}
          >
            + New Project
          </Button>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {rows.map((p) => (
            <Card
              key={p.id}
              className="group relative flex flex-col overflow-hidden border-border/80 bg-card shadow-sm transition-shadow hover:shadow-md"
            >
              <CardContent className="flex flex-1 flex-col p-0">
                <div className="flex items-start justify-between gap-2 border-b border-border/60 p-4">
                  <div className="flex min-w-0 gap-3">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-emerald-500/12 text-emerald-400 ring-1 ring-emerald-500/25">
                      <Server className="size-5" strokeWidth={1.75} aria-hidden />
                    </span>
                    <div className="min-w-0 space-y-0.5">
                      <h3 className="truncate font-semibold leading-tight text-foreground">{p.name}</h3>
                      <p className="font-mono text-[11px] text-muted-foreground">ID: {p.slug}</p>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      type="button"
                      className={cn(
                        buttonVariants({ variant: "ghost", size: "icon-sm" }),
                        "size-8 shrink-0 text-muted-foreground hover:text-foreground",
                      )}
                      aria-label="Project actions"
                    >
                      <MoreVertical className="size-4" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="min-w-[10rem]">
                      <DropdownMenuItem
                        onClick={() => {
                          router.push(`/logs?slug=${encodeURIComponent(p.slug)}`);
                        }}
                      >
                        View compose logs
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        variant="destructive"
                        onClick={() => void removeStack(p)}
                        disabled={removingSlug === p.slug}
                      >
                        {removingSlug === p.slug ? (
                          <>
                            <Loader2 className="size-4 animate-spin" />
                            Removing…
                          </>
                        ) : (
                          <>
                            <Trash2 className="size-4" />
                            Remove stack
                          </>
                        )}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div className="flex flex-1 flex-col gap-4 p-4">
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    Self-hosted Supabase Docker stack with Kong, Postgres, and optional Studio routing via Traefik.
                  </p>

                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <span
                      className={cn(
                        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize",
                        p.status === "running" && "bg-emerald-500/15 text-emerald-400",
                        p.status === "stopped" && "bg-muted text-muted-foreground",
                        p.status === "error" && "bg-destructive/15 text-destructive",
                        (p.status === "provisioning" || !["running", "stopped", "error"].includes(p.status)) &&
                          "bg-amber-500/15 text-amber-400",
                      )}
                    >
                      {p.status}
                    </span>
                    {p.status === "running" ? (
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        className="gap-1.5 border border-border bg-muted/80 hover:bg-muted"
                        onClick={() => void stop(p.slug)}
                      >
                        <Square className="size-3.5 fill-current" />
                        Stop
                      </Button>
                    ) : (
                      <Button
                        type="button"
                        size="sm"
                        className="gap-1.5 bg-emerald-600 text-white hover:bg-emerald-500 dark:bg-emerald-600 dark:hover:bg-emerald-500"
                        onClick={() => void start(p.slug)}
                      >
                        <Play className="size-3.5 fill-current" />
                        Start
                      </Button>
                    )}
                  </div>

                  {p.lastError ? (
                    <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-xs">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-medium text-destructive">Last error</span>
                        <Link
                          href={`/logs?slug=${encodeURIComponent(p.slug)}`}
                          className={cn(buttonVariants({ variant: "link", size: "sm" }), "h-auto min-h-0 p-0 text-[11px]")}
                        >
                          Logs
                        </Link>
                      </div>
                      <pre className="mt-2 max-h-24 overflow-auto whitespace-pre-wrap break-words font-mono text-[11px] text-muted-foreground">
                        {p.lastError}
                      </pre>
                    </div>
                  ) : null}
                </div>

                <div className="mt-auto grid grid-cols-2 gap-3 border-t border-border/60 bg-muted/20 px-4 py-3 text-xs">
                  <div>
                    <p className="font-medium text-muted-foreground">API</p>
                    <p className="mt-0.5 truncate font-mono text-foreground" title={p.kongHost ?? ""}>
                      {apiDisplay(p.kongHost)}
                    </p>
                  </div>
                  <div>
                    <p className="font-medium text-muted-foreground">Database</p>
                    <p className="mt-0.5 font-mono text-foreground">5432</p>
                    <p className="text-[10px] text-muted-foreground/80">Postgres (container)</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          <button
            type="button"
            onClick={() => setWizardOpen(true)}
            className={cn(
              "group flex min-h-[280px] flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-border/80 bg-transparent p-6 text-center transition-colors",
              "hover:border-emerald-500/40 hover:bg-emerald-500/[0.04]",
            )}
          >
            <span className="flex size-14 items-center justify-center rounded-full bg-muted/50 text-muted-foreground ring-1 ring-border transition-colors group-hover:text-emerald-400">
              <Plus className="size-7 stroke-[2.5]" />
            </span>
            <span className="text-sm font-medium text-muted-foreground transition-colors group-hover:text-foreground">
              Add Project
            </span>
          </button>
        </div>
      </AppShell>

      <ProjectCreateWizard open={wizardOpen} onOpenChange={setWizardOpen} onCreated={refresh} />
    </>
  );
}

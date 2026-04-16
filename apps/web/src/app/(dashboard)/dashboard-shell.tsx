"use client";

import * as React from "react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import {
  Activity,
  CalendarClock,
  Database,
  Play,
  Square,
  Radio,
} from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProjectCreateWizard } from "@/app/(dashboard)/projects/project-create-wizard";
import { APP_VERSION } from "@/lib/constants";
import { cn } from "@/lib/utils";

type ProjectRow = {
  id: string;
  slug: string;
  name: string;
  status: string;
  kongHost: string | null;
  createdAt: string | Date;
};

type TaskRow = {
  id: string;
  status: string;
  type: string;
  createdAt: string | Date;
};

type AuditRow = {
  id: string;
  action: string;
  detail: string | null;
  createdAt: string | Date;
};

function formatAuditLine(a: AuditRow): string {
  if (a.action === "project.create") return "New stack provisioned";
  if (a.action === "project.delete") return "Stack removed";
  if (a.detail) {
    try {
      const j = JSON.parse(a.detail) as { slug?: string };
      if (j.slug && typeof j.slug === "string") {
        return `${a.action.replace(/\./g, " ")} (${j.slug})`;
      }
    } catch {
      /* ignore */
    }
  }
  return a.action.replace(/\./g, " ");
}

export function DashboardShell({
  initialProjects,
  initialTasks,
  initialAudit,
}: {
  initialProjects: ProjectRow[];
  initialTasks: TaskRow[];
  initialAudit: AuditRow[];
}) {
  const [wizardOpen, setWizardOpen] = React.useState(false);
  const [projects, setProjects] = React.useState(initialProjects);
  const [tasks, setTasks] = React.useState(initialTasks);
  const [audit, setAudit] = React.useState(initialAudit);

  async function refresh() {
    const [pr, tr] = await Promise.all([
      fetch("/api/projects", { credentials: "include" }).then((r) => r.json() as Promise<{ projects: ProjectRow[] }>),
      fetch("/api/tasks", { credentials: "include" }).then((r) => r.json() as Promise<{ tasks: TaskRow[] }>),
    ]);
    setProjects(pr.projects);
    setTasks(tr.tasks);
    const ar = await fetch("/api/audit-logs", { credentials: "include" })
      .then((r) => r.json() as Promise<{ logs: AuditRow[] }>)
      .catch(() => ({ logs: [] }));
    setAudit(ar.logs ?? []);
  }

  const running = projects.filter((p) => p.status === "running").length;
  const stopped = projects.filter((p) => p.status === "stopped").length;
  const errored = projects.filter((p) => p.status === "error").length;
  const inactive = stopped + errored;

  const recentProjects = [...projects].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt)).slice(0, 5);

  return (
    <>
      <AppShell
        title="Dashboard"
        subtitle={`Overview of your Supabase instances · v${APP_VERSION}`}
        showBreadcrumb={false}
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
        <div className="space-y-8">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              icon={Database}
              label="Total Projects"
              value={projects.length}
              sub={`${running} running`}
              iconClass="text-emerald-400"
            />
            <StatCard
              icon={Play}
              label="Running"
              value={running}
              sub="Active instances"
              iconClass="text-emerald-400"
            />
            <StatCard
              icon={Square}
              label="Stopped"
              value={inactive}
              sub={errored ? `${stopped} stopped · ${errored} error` : "Inactive instances"}
              iconClass="text-emerald-400"
            />
            <StatCard
              icon={CalendarClock}
              label="Scheduled Tasks"
              value={tasks.length}
              sub={`${tasks.length} total`}
              iconClass="text-emerald-400"
            />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="border-border/80 bg-card">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-base font-semibold">Recent Projects</CardTitle>
                <Link
                  href="/projects"
                  className="text-xs font-medium text-emerald-500/90 hover:text-emerald-400 hover:underline"
                >
                  View all →
                </Link>
              </CardHeader>
              <CardContent>
                {recentProjects.length === 0 ? (
                  <div className="flex flex-col items-center justify-center gap-4 py-12 text-center">
                    <Database className="size-14 text-muted-foreground/40" aria-hidden />
                    <p className="text-sm text-muted-foreground">No projects yet.</p>
                    <Button
                      type="button"
                      variant="outline"
                      className="border-emerald-500/50 text-emerald-400 hover:bg-emerald-500/10 hover:text-emerald-300"
                      onClick={() => setWizardOpen(true)}
                    >
                      Create your first project
                    </Button>
                  </div>
                ) : (
                  <ul className="divide-y divide-border/60">
                    {recentProjects.map((p) => (
                      <li key={p.id} className="flex items-center justify-between gap-3 py-3 first:pt-0">
                        <div className="min-w-0">
                          <p className="truncate font-medium text-foreground">{p.name}</p>
                          <p className="truncate font-mono text-xs text-muted-foreground">{p.slug}</p>
                        </div>
                        <span
                          className={cn(
                            "shrink-0 rounded-full px-2 py-0.5 text-xs font-medium capitalize",
                            p.status === "running" && "bg-emerald-500/15 text-emerald-400",
                            p.status === "stopped" && "bg-muted text-muted-foreground",
                            p.status === "error" && "bg-destructive/15 text-destructive",
                            (p.status === "provisioning" || !["running", "stopped", "error"].includes(p.status)) &&
                              "bg-amber-500/15 text-amber-400",
                          )}
                        >
                          {p.status}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>

            <Card className="border-border/80 bg-card">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-base font-semibold">Recent Activity</CardTitle>
                <Radio className="size-4 text-muted-foreground/60" aria-hidden />
              </CardHeader>
              <CardContent>
                {audit.length === 0 ? (
                  <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
                    <Activity className="size-14 text-muted-foreground/40" aria-hidden />
                    <p className="text-sm text-muted-foreground">No activity yet.</p>
                  </div>
                ) : (
                  <ul className="space-y-3">
                    {audit.slice(0, 8).map((a) => (
                      <li key={a.id} className="flex gap-3 text-sm">
                        <div className="mt-1.5 size-1.5 shrink-0 rounded-full bg-emerald-500/80" aria-hidden />
                        <div className="min-w-0 flex-1">
                          <p className="leading-snug text-foreground">{formatAuditLine(a)}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(a.createdAt), { addSuffix: true })}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </AppShell>

      <ProjectCreateWizard open={wizardOpen} onOpenChange={setWizardOpen} onCreated={refresh} />
    </>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  iconClass,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
  sub: string;
  iconClass?: string;
}) {
  return (
    <Card className="border-border/80 bg-card shadow-sm">
      <CardContent className="flex items-start gap-4 p-5">
        <span
          className={cn(
            "flex size-11 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 ring-1 ring-emerald-500/20",
            iconClass,
          )}
        >
          <Icon className="size-5" />
        </span>
        <div className="min-w-0 space-y-1">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
          <p className="text-3xl font-semibold tabular-nums tracking-tight text-foreground">{value}</p>
          <p className="text-xs text-muted-foreground">{sub}</p>
        </div>
      </CardContent>
    </Card>
  );
}

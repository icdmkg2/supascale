"use client";

import * as React from "react";
import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
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

function statusClass(status: string) {
  switch (status) {
    case "running":
      return "text-emerald-400";
    case "error":
      return "text-destructive";
    case "provisioning":
      return "text-amber-400";
    default:
      return "text-muted-foreground";
  }
}

export function ProjectsPanel() {
  const [rows, setRows] = React.useState<ProjectRow[]>([]);

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

  return (
    <div className="space-y-8">
      <ProjectCreateWizard onCreated={refresh} />

      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle>Stacks</CardTitle>
          <CardDescription>Status and lifecycle controls per project directory under PROJECTS_ROOT.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>API host</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((p) => (
                <React.Fragment key={p.id}>
                  <TableRow>
                    <TableCell className="font-medium">{p.name}</TableCell>
                    <TableCell className="font-mono text-xs">{p.slug}</TableCell>
                    <TableCell className={cn("font-medium capitalize", statusClass(p.status))}>
                      {p.status}
                    </TableCell>
                    <TableCell className="text-xs text-foreground/85">{p.kongHost}</TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button type="button" size="sm" variant="secondary" onClick={() => start(p.slug)}>
                        Start
                      </Button>
                      <Button type="button" size="sm" variant="outline" onClick={() => stop(p.slug)}>
                        Stop
                      </Button>
                    </TableCell>
                  </TableRow>
                  {p.lastError ? (
                    <TableRow className="hover:bg-transparent">
                      <TableCell colSpan={5} className="border-t-0 pt-0">
                        <div className="rounded-md border border-destructive/35 bg-destructive/5 p-3">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <p className="text-xs font-medium text-destructive">Last error</p>
                            <Link
                              href={`/logs?slug=${encodeURIComponent(p.slug)}`}
                              className={cn(buttonVariants({ variant: "link", size: "sm" }), "h-auto min-h-0 p-0 text-xs")}
                            >
                              Open compose logs
                            </Link>
                          </div>
                          <pre className="mt-2 max-h-56 overflow-auto whitespace-pre-wrap break-words font-mono text-xs text-muted-foreground">
                            {p.lastError}
                          </pre>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : null}
                </React.Fragment>
              ))}
              {rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    No projects yet.
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type BackupRow = {
  id: string;
  projectId: string;
  scheduleCron: string | null;
  retentionDays: number | null;
  storageId: string | null;
  enabled: boolean;
};

type ProjectRow = { id: string; slug: string; name: string };

export function BackupsClient() {
  const [rows, setRows] = React.useState<BackupRow[]>([]);
  const [projects, setProjects] = React.useState<ProjectRow[]>([]);
  const [projectId, setProjectId] = React.useState("");
  const [cron, setCron] = React.useState("0 3 * * *");
  const [retention, setRetention] = React.useState("7");

  async function refresh() {
    const [b, p] = await Promise.all([
      fetch("/api/backups", { credentials: "include" }),
      fetch("/api/projects", { credentials: "include" }),
    ]);
    if (b.ok) setRows(((await b.json()) as { backups: BackupRow[] }).backups);
    if (p.ok) setProjects(((await p.json()) as { projects: ProjectRow[] }).projects);
  }

  React.useEffect(() => {
    void refresh();
  }, []);

  async function create() {
    await fetch("/api/backups", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        projectId,
        scheduleCron: cron,
        retentionDays: Number(retention),
        enabled: true,
      }),
    });
    await refresh();
  }

  return (
    <div className="space-y-6">
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle>New backup policy</CardTitle>
          <CardDescription>Stores schedule metadata; execution is handled via Tasks + pg_dump on the host.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2">
          <div className="space-y-2 md:col-span-2">
            <Label>Project</Label>
            <select
              className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
            >
              <option value="">Select…</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.slug})
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="cron">Cron</Label>
            <Input id="cron" value={cron} onChange={(e) => setCron(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ret">Retention (days)</Label>
            <Input id="ret" value={retention} onChange={(e) => setRetention(e.target.value)} />
          </div>
          <div className="md:col-span-2">
            <Button type="button" onClick={() => void create()} disabled={!projectId}>
              Save policy
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle>Policies</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Project</TableHead>
                <TableHead>Cron</TableHead>
                <TableHead>Retention</TableHead>
                <TableHead>Enabled</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-mono text-xs">{r.projectId}</TableCell>
                  <TableCell className="text-xs">{r.scheduleCron}</TableCell>
                  <TableCell>{r.retentionDays}</TableCell>
                  <TableCell>{r.enabled ? "yes" : "no"}</TableCell>
                </TableRow>
              ))}
              {rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground">
                    No policies yet.
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

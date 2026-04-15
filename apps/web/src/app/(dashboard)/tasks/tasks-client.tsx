"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type TaskRow = {
  id: string;
  type: string;
  status: string;
  payload: string | null;
  result: string | null;
  error: string | null;
  createdAt: number;
};

export function TasksClient() {
  const [rows, setRows] = React.useState<TaskRow[]>([]);
  const [slug, setSlug] = React.useState("");

  async function refresh() {
    const res = await fetch("/api/tasks", { credentials: "include" });
    if (!res.ok) return;
    const data = (await res.json()) as { tasks: TaskRow[] };
    setRows(data.tasks);
  }

  React.useEffect(() => {
    void refresh();
    const id = window.setInterval(() => void refresh(), 4000);
    return () => window.clearInterval(id);
  }, []);

  async function enqueue(type: "compose_pull" | "backup" | "noop") {
    const res = await fetch("/api/tasks", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, slug: type === "noop" ? undefined : slug }),
    });
    if (res.ok) await refresh();
  }

  return (
    <div className="space-y-6">
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle>Enqueue</CardTitle>
          <CardDescription>Queue maintenance tasks processed by the panel worker.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap items-end gap-3">
          <div className="space-y-2">
            <Label htmlFor="slug">Project slug</Label>
            <Input id="slug" value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="my-project" />
          </div>
          <Button type="button" variant="secondary" onClick={() => void enqueue("compose_pull")}>
            Compose pull
          </Button>
          <Button type="button" variant="secondary" onClick={() => void enqueue("backup")}>
            Backup job
          </Button>
          <Button type="button" variant="outline" onClick={() => void enqueue("noop")}>
            No-op
          </Button>
        </CardContent>
      </Card>

      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle>Recent tasks</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Result</TableHead>
                <TableHead>Error</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((t) => (
                <TableRow key={t.id}>
                  <TableCell className="font-mono text-xs">{t.type}</TableCell>
                  <TableCell>{t.status}</TableCell>
                  <TableCell className="max-w-[420px] truncate text-xs text-muted-foreground">
                    {t.result}
                  </TableCell>
                  <TableCell className="max-w-[320px] truncate text-xs text-destructive">{t.error}</TableCell>
                </TableRow>
              ))}
              {rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground">
                    No tasks yet.
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

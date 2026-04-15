"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type ProjectRow = { id: string; slug: string; name: string };

export function LogsClient({ initialSlug }: { initialSlug?: string }) {
  const [projects, setProjects] = React.useState<ProjectRow[]>([]);
  const [slug, setSlug] = React.useState(initialSlug ?? "");
  const [service, setService] = React.useState("kong");
  const [logs, setLogs] = React.useState("");

  React.useEffect(() => {
    async function loadProjects() {
      const res = await fetch("/api/projects", { credentials: "include" });
      if (!res.ok) return;
      const data = (await res.json()) as { projects: ProjectRow[] };
      setProjects(data.projects);
      setSlug((prev) => {
        if (initialSlug && data.projects.some((p) => p.slug === initialSlug)) return initialSlug;
        if (prev && data.projects.some((p) => p.slug === prev)) return prev;
        return data.projects[0]?.slug ?? "";
      });
    }
    void loadProjects();
  }, [initialSlug]);

  async function fetchLogs() {
    const qs = new URLSearchParams();
    if (service.trim()) qs.set("service", service.trim());
    const res = await fetch(`/api/projects/${encodeURIComponent(slug)}/logs?${qs.toString()}`, {
      credentials: "include",
    });
    if (!res.ok) {
      setLogs("Failed to load logs");
      return;
    }
    const data = (await res.json()) as { logs: string };
    setLogs(data.logs);
  }

  return (
    <Card className="border-border bg-card">
      <CardHeader>
        <CardTitle>Compose logs</CardTitle>
        <CardDescription>Uses `docker compose logs` against the generated project directory.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 md:grid-cols-3">
          <div className="space-y-2">
            <Label>Project</Label>
            <select
              className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
            >
              {projects.map((p) => (
                <option key={p.id} value={p.slug}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="svc">Service (optional)</Label>
            <Input
              id="svc"
              value={service}
              onChange={(e) => setService(e.target.value)}
              placeholder="kong, studio, db, auth, ..."
            />
          </div>
        </div>
        <Button type="button" onClick={() => void fetchLogs()}>
          Fetch
        </Button>
        <pre className="max-h-[520px] overflow-auto rounded-md border border-border bg-black/40 p-4 text-xs text-muted-foreground">
          {logs || "—"}
        </pre>
      </CardContent>
    </Card>
  );
}

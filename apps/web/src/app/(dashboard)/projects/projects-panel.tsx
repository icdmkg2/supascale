"use client";

import * as React from "react";
import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";

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
  const [name, setName] = React.useState("");
  const [slug, setSlug] = React.useState("");
  const [kongHost, setKongHost] = React.useState("api.example.com");
  const [studioHost, setStudioHost] = React.useState("");
  const [tls, setTls] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);

  async function refresh() {
    const res = await fetch("/api/projects", { credentials: "include" });
    if (!res.ok) return;
    const data = (await res.json()) as { projects: ProjectRow[] };
    setRows(data.projects);
  }

  React.useEffect(() => {
    void refresh();
  }, []);

  async function onCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          slug,
          kongHost,
          studioHost: studioHost || null,
          tls,
        }),
      });
      if (!res.ok) {
        const j = (await res.json().catch(() => null)) as { error?: unknown };
        setError(typeof j?.error === "string" ? j.error : "Create failed");
        return;
      }
      const created = (await res.json()) as {
        status: string;
        lastError?: string | null;
        logs?: string;
      };
      if (created.status === "error") {
        setError(
          "The stack was saved but docker compose failed to start it. See “Last error” under this project in the table below.",
        );
      } else {
        setError(null);
      }
      setName("");
      setSlug("");
      await refresh();
    } finally {
      setBusy(false);
    }
  }

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
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle>New project</CardTitle>
          <CardDescription>
            Downloads official Supabase Docker files, writes Traefik labels, and runs{" "}
            <code className="text-xs">docker compose up</code>.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onCreate} className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="slug">Slug</Label>
              <Input
                id="slug"
                value={slug}
                onChange={(e) => setSlug(e.target.value.toLowerCase())}
                placeholder="my-project"
                required
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="kong">Kong / API hostname (Traefik Host rule)</Label>
              <Input id="kong" value={kongHost} onChange={(e) => setKongHost(e.target.value)} required />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="studio">Studio hostname (optional)</Label>
              <Input
                id="studio"
                value={studioHost}
                onChange={(e) => setStudioHost(e.target.value)}
                placeholder="studio.example.com"
              />
            </div>
            <div className="flex items-center gap-2 md:col-span-2">
              <Switch id="tls" checked={tls} onCheckedChange={setTls} />
              <Label htmlFor="tls">Use TLS entrypoint + cert resolver (from Settings)</Label>
            </div>
            {error ? (
              <div className="rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive md:col-span-2">
                {error}
              </div>
            ) : null}
            <div className="md:col-span-2">
              <Button type="submit" disabled={busy}>
                {busy ? "Provisioning…" : "Create stack"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

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

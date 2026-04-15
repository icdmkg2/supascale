"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type ProjectRow = {
  id: string;
  slug: string;
  name: string;
  status: string;
  kongHost: string | null;
  studioHost: string | null;
  tlsEnabled: boolean;
};

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
            {error ? <p className="text-sm text-destructive md:col-span-2">{error}</p> : null}
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
                <TableRow key={p.id}>
                  <TableCell className="font-medium">{p.name}</TableCell>
                  <TableCell className="font-mono text-xs">{p.slug}</TableCell>
                  <TableCell>{p.status}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{p.kongHost}</TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button type="button" size="sm" variant="secondary" onClick={() => start(p.slug)}>
                      Start
                    </Button>
                    <Button type="button" size="sm" variant="outline" onClick={() => stop(p.slug)}>
                      Stop
                    </Button>
                  </TableCell>
                </TableRow>
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

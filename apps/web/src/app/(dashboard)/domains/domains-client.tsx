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
  kongHost: string | null;
  studioHost: string | null;
  tlsEnabled: boolean;
};

export function DomainsClient() {
  const [rows, setRows] = React.useState<ProjectRow[]>([]);
  const [edit, setEdit] = React.useState<Record<string, { kong: string; studio: string; tls: boolean }>>({});

  async function refresh() {
    const res = await fetch("/api/projects", { credentials: "include" });
    if (!res.ok) return;
    const data = (await res.json()) as { projects: ProjectRow[] };
    setRows(data.projects);
    const next: Record<string, { kong: string; studio: string; tls: boolean }> = {};
    for (const p of data.projects) {
      next[p.slug] = {
        kong: p.kongHost ?? "",
        studio: p.studioHost ?? "",
        tls: p.tlsEnabled,
      };
    }
    setEdit(next);
  }

  React.useEffect(() => {
    void refresh();
  }, []);

  async function save(slug: string) {
    const e = edit[slug];
    if (!e) return;
    await fetch(`/api/projects/${encodeURIComponent(slug)}`, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        kongHost: e.kong,
        studioHost: e.studio || null,
        tls: e.tls,
      }),
    });
    await refresh();
  }

  return (
    <Card className="border-border bg-card">
      <CardHeader>
        <CardTitle>Project routers</CardTitle>
        <CardDescription>
          Updates <code className="text-xs">docker-compose.traefik.yml</code> and reapplies{" "}
          <code className="text-xs">docker compose up -d</code>.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Project</TableHead>
              <TableHead>API host</TableHead>
              <TableHead>Studio host</TableHead>
              <TableHead>TLS</TableHead>
              <TableHead className="text-right">Save</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((p) => (
              <TableRow key={p.id}>
                <TableCell className="font-medium">{p.name}</TableCell>
                <TableCell>
                  <Input
                    value={edit[p.slug]?.kong ?? ""}
                    onChange={(e) =>
                      setEdit((s) => ({
                        ...s,
                        [p.slug]: { ...(s[p.slug] ?? { kong: "", studio: "", tls: false }), kong: e.target.value },
                      }))
                    }
                  />
                </TableCell>
                <TableCell>
                  <Input
                    value={edit[p.slug]?.studio ?? ""}
                    onChange={(e) =>
                      setEdit((s) => ({
                        ...s,
                        [p.slug]: { ...(s[p.slug] ?? { kong: "", studio: "", tls: false }), studio: e.target.value },
                      }))
                    }
                  />
                </TableCell>
                <TableCell>
                  <Switch
                    checked={edit[p.slug]?.tls ?? false}
                    onCheckedChange={(v) =>
                      setEdit((s) => ({
                        ...s,
                        [p.slug]: { ...(s[p.slug] ?? { kong: "", studio: "", tls: false }), tls: v },
                      }))
                    }
                  />
                </TableCell>
                <TableCell className="text-right">
                  <Button type="button" size="sm" onClick={() => void save(p.slug)}>
                    Apply
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">
                  No projects yet — create one under Projects.
                </TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

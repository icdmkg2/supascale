"use client";

import * as React from "react";
import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Globe, Shield, ShieldOff } from "lucide-react";
import { cn } from "@/lib/utils";

type ProjectRow = {
  id: string;
  slug: string;
  name: string;
  kongHost: string | null;
  studioHost: string | null;
  tlsEnabled: boolean;
};

function hostCount(p: ProjectRow) {
  return (p.kongHost?.trim() ? 1 : 0) + (p.studioHost?.trim() ? 1 : 0);
}

function hasAnyHost(p: ProjectRow) {
  return hostCount(p) > 0;
}

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

  const configuredHostnames = rows.reduce((acc, p) => acc + hostCount(p), 0);
  const sslEnabledProjects = rows.filter((p) => p.tlsEnabled && hasAnyHost(p)).length;
  const sslDisabledProjects = rows.filter((p) => !p.tlsEnabled && hasAnyHost(p)).length;
  const noDomainProjects = rows.filter((p) => !hasAnyHost(p)).length;

  const stats = [
    {
      label: "Configured Domains",
      value: configuredHostnames,
      icon: Globe,
      iconClass: "bg-primary/15 text-primary",
    },
    {
      label: "SSL Enabled",
      value: sslEnabledProjects,
      icon: Shield,
      iconClass: "bg-primary/15 text-primary",
    },
    {
      label: "SSL Disabled",
      value: sslDisabledProjects,
      icon: ShieldOff,
      iconClass: "bg-amber-500/15 text-amber-500",
    },
    {
      label: "No Domain",
      value: noDomainProjects,
      icon: Globe,
      iconClass: "bg-muted text-muted-foreground",
    },
  ];

  return (
    <div className="space-y-8">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label} className="border-border/80 bg-card/80">
            <CardContent className="flex items-center gap-4 p-5">
              <span
                className={cn("flex size-11 shrink-0 items-center justify-center rounded-xl", s.iconClass)}
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

      <div className="flex gap-4 rounded-xl border border-border/80 border-l-4 border-l-primary bg-card/60 px-4 py-4 sm:px-5">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Globe className="size-5" aria-hidden />
        </span>
        <div className="min-w-0 space-y-1">
          <p className="font-semibold text-foreground">Domain Management</p>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Configure custom domains for your Supabase projects with automatic SSL certificate management. Each
            project can have its own domain with nginx, Apache, or Caddy as the reverse proxy.
          </p>
        </div>
      </div>

      {rows.length === 0 ? (
        <Card className="border-border/80 bg-card/80">
          <CardContent className="flex flex-col items-center justify-center gap-4 px-6 py-16 text-center">
            <span className="flex size-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Globe className="size-9" aria-hidden />
            </span>
            <div className="space-y-2">
              <h2 className="text-lg font-semibold text-foreground">No projects yet</h2>
              <p className="max-w-md text-sm text-muted-foreground">
                Create a project first, then you can configure custom domains for it.
              </p>
            </div>
            <Link href="/projects" className={cn(buttonVariants(), "mt-2")}>
              Create Project
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Set API (Kong) and optional Studio hostnames. Updates{" "}
            <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">docker-compose.traefik.yml</code> and
            reapplies the stack.
          </p>
          {rows.map((p) => (
            <Card key={p.id} className="border-border/80 bg-card/90">
              <CardContent className="space-y-4 p-5 sm:p-6">
                <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border/60 pb-4">
                  <div className="flex min-w-0 gap-3">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Globe className="size-5" aria-hidden />
                    </span>
                    <div>
                      <p className="font-semibold text-foreground">{p.name}</p>
                      <p className="font-mono text-xs text-muted-foreground">{p.slug}</p>
                    </div>
                  </div>
                  <Button type="button" size="sm" onClick={() => void save(p.slug)}>
                    Apply changes
                  </Button>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor={`kong-${p.slug}`}>API (Kong) host</Label>
                    <Input
                      id={`kong-${p.slug}`}
                      value={edit[p.slug]?.kong ?? ""}
                      onChange={(e) =>
                        setEdit((s) => ({
                          ...s,
                          [p.slug]: { ...(s[p.slug] ?? { kong: "", studio: "", tls: false }), kong: e.target.value },
                        }))
                      }
                      placeholder="api.example.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`studio-${p.slug}`}>Studio host (optional)</Label>
                    <Input
                      id={`studio-${p.slug}`}
                      value={edit[p.slug]?.studio ?? ""}
                      onChange={(e) =>
                        setEdit((s) => ({
                          ...s,
                          [p.slug]: { ...(s[p.slug] ?? { kong: "", studio: "", tls: false }), studio: e.target.value },
                        }))
                      }
                      placeholder="studio.example.com"
                    />
                  </div>
                  <div className="flex items-center justify-between gap-4 rounded-lg border border-border/80 px-4 py-3 md:col-span-2">
                    <div>
                      <p className="text-sm font-medium">TLS / SSL</p>
                      <p className="text-xs text-muted-foreground">Enable HTTPS via Traefik labels.</p>
                    </div>
                    <Switch
                      checked={edit[p.slug]?.tls ?? false}
                      onCheckedChange={(v) =>
                        setEdit((s) => ({
                          ...s,
                          [p.slug]: { ...(s[p.slug] ?? { kong: "", studio: "", tls: false }), tls: v },
                        }))
                      }
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

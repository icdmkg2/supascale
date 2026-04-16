"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

export function SettingsClient() {
  const [traefikNetwork, setTraefikNetwork] = React.useState("traefik_net");
  const [entrypoint, setEntrypoint] = React.useState("web");
  const [entrypointSecure, setEntrypointSecure] = React.useState("websecure");
  const [certResolver, setCertResolver] = React.useState("");
  const [deployDebugLogs, setDeployDebugLogs] = React.useState(false);

  async function load() {
    const res = await fetch("/api/settings", { credentials: "include" });
    if (!res.ok) return;
    const data = (await res.json()) as {
      settings: Record<string, string | null>;
    };
    setTraefikNetwork(data.settings.traefik_network ?? "traefik_net");
    setEntrypoint(data.settings.traefik_entrypoint ?? "web");
    setEntrypointSecure(data.settings.traefik_entrypoint_websecure ?? "websecure");
    setCertResolver(data.settings.traefik_cert_resolver ?? "");
    const d = data.settings.deploy_debug_logs;
    setDeployDebugLogs(d === "true" || d === "1");
  }

  React.useEffect(() => {
    void load();
  }, []);

  async function save() {
    await fetch("/api/settings", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        traefik_network: traefikNetwork,
        traefik_entrypoint: entrypoint,
        traefik_entrypoint_websecure: entrypointSecure,
        traefik_cert_resolver: certResolver || null,
        deploy_debug_logs: deployDebugLogs,
      }),
    });
    await load();
  }

  return (
    <div className="space-y-6">
    <Card className="border-border bg-card">
      <CardHeader>
        <CardTitle>Traefik</CardTitle>
        <CardDescription>
          These values are written into generated <code className="text-xs">docker-compose.traefik.yml</code>{" "}
          files. Align entrypoints and cert resolver names with your existing Traefik static configuration.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="tn">External network name</Label>
          <Input id="tn" value={traefikNetwork} onChange={(e) => setTraefikNetwork(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="ep">HTTP entrypoint</Label>
          <Input id="ep" value={entrypoint} onChange={(e) => setEntrypoint(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="eps">HTTPS entrypoint</Label>
          <Input id="eps" value={entrypointSecure} onChange={(e) => setEntrypointSecure(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="cr">Cert resolver (optional)</Label>
          <Input id="cr" value={certResolver} onChange={(e) => setCertResolver(e.target.value)} />
        </div>
        <div className="md:col-span-2">
          <Button type="button" onClick={() => void save()}>
            Save settings
          </Button>
        </div>
      </CardContent>
    </Card>

    <Card className="border-border bg-card">
      <CardHeader>
        <CardTitle>Developer</CardTitle>
        <CardDescription>
          Optional diagnostics that add noise but help when deploy hangs on the host.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col gap-3 rounded-lg border border-border/80 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium">Deploy log panel</p>
            <p className="text-xs text-muted-foreground">
              While creating a project, poll <code className="text-[11px]">docker compose logs</code> and show output
              in the wizard (same as the Logs page).
            </p>
          </div>
          <Switch checked={deployDebugLogs} onCheckedChange={setDeployDebugLogs} aria-label="Show deploy logs in wizard" />
        </div>
        <Button type="button" variant="secondary" onClick={() => void save()}>
          Save developer settings
        </Button>
      </CardContent>
    </Card>
    </div>
  );
}

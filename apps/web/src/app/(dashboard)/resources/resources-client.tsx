"use client";

import * as React from "react";
import { Pause, Play, RefreshCw } from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatBytes, formatDuration } from "@/lib/format";
import { cn } from "@/lib/utils";

type MetricsPayload = {
  paused: boolean;
  host: {
    hostname: string | null;
    os: string | null;
    cpuModel: string | null;
    cores: number | null;
    uptimeSec: number | null;
  };
  snapshot: {
    cpuPercent: number | null;
    memUsedBytes: number | null;
    memTotalBytes: number | null;
    diskUsedPercent: number | null;
    netInBps: number | null;
    netOutBps: number | null;
  };
  history: { time: number; cpu: number | null; mem: number | null; netIn: number | null; netOut: number | null }[];
  error?: string;
};

export function ResourcesClient() {
  const [data, setData] = React.useState<MetricsPayload | null>(null);
  const [err, setErr] = React.useState<string | null>(null);

  async function load() {
    setErr(null);
    const res = await fetch("/api/metrics", { credentials: "include" });
    if (!res.ok) {
      const j = (await res.json().catch(() => null)) as { error?: string } | null;
      setErr(j?.error ?? "Unable to load metrics");
      return;
    }
    setData((await res.json()) as MetricsPayload);
  }

  React.useEffect(() => {
    void load();
    const id = window.setInterval(() => void load(), 2000);
    return () => window.clearInterval(id);
  }, []);

  async function togglePause() {
    const next = !data?.paused;
    await fetch("/api/metrics", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ paused: next }),
    });
    await load();
  }

  const chartData =
    data?.history.map((h, i) => ({
      i,
      cpu: h.cpu ?? 0,
      mem: h.mem ?? 0,
      netIn: (h.netIn ?? 0) / 1024,
      netOut: (h.netOut ?? 0) / 1024,
    })) ?? [];

  const s = data?.snapshot;
  const memPct =
    s?.memUsedBytes != null && s?.memTotalBytes != null && s.memTotalBytes > 0
      ? (100 * s.memUsedBytes) / s.memTotalBytes
      : null;

  const overview = data?.host
    ? `${data.host.hostname ?? "host"} | ${data.host.os ?? "OS"} | ${data.host.cpuModel ?? "CPU"} | ${data.host.cores ?? "?"} cores | Uptime: ${
        data.host.uptimeSec != null ? formatDuration(data.host.uptimeSec) : "—"
      }`
    : "Loading host overview…";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-card px-4 py-3">
        <div className="text-sm text-muted-foreground">{overview}</div>
        <div className="flex items-center gap-2">
          <Button type="button" variant="secondary" size="sm" onClick={() => void togglePause()}>
            {data?.paused ? <Play className="mr-1 h-4 w-4" /> : <Pause className="mr-1 h-4 w-4" />}
            {data?.paused ? "Resume" : "Pause"}
          </Button>
          <Button type="button" variant="outline" size="icon" onClick={() => void load()} aria-label="Refresh">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {err ? <p className="text-sm text-destructive">{err}</p> : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title="CPU Usage"
          value={s?.cpuPercent != null ? `${s.cpuPercent.toFixed(1)}%` : "—"}
          sub={data?.host?.cores != null ? `${data.host.cores} cores` : undefined}
          tone="emerald"
          pct={s?.cpuPercent ?? 0}
        />
        <MetricCard
          title="Memory"
          value={memPct != null ? `${memPct.toFixed(1)}%` : "—"}
          sub={
            s?.memUsedBytes != null && s?.memTotalBytes != null
              ? `${formatBytes(s.memUsedBytes)} / ${formatBytes(s.memTotalBytes)}`
              : undefined
          }
          tone={memPct != null && memPct > 90 ? "rose" : "emerald"}
          pct={memPct ?? 0}
        />
        <MetricCard
          title="Disk"
          value={s?.diskUsedPercent != null ? `${s.diskUsedPercent.toFixed(1)}%` : "—"}
          tone="sky"
          pct={s?.diskUsedPercent ?? 0}
        />
        <Card className="border-border bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Network</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            <div>IN: {s?.netInBps != null ? `${s.netInBps.toFixed(2)} B/s` : "—"}</div>
            <div>OUT: {s?.netOutBps != null ? `${s.netOutBps.toFixed(2)} B/s` : "—"}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="text-sm">CPU & Memory (last samples)</CardTitle>
          </CardHeader>
          <CardContent className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis dataKey="i" hide />
                <YAxis domain={[0, 100]} width={32} stroke="rgba(255,255,255,0.35)" />
                <Tooltip
                  contentStyle={{ background: "#111", border: "1px solid #222" }}
                  labelStyle={{ color: "#aaa" }}
                />
                <Legend />
                <Line type="monotone" dataKey="cpu" name="CPU %" stroke="#10b981" dot={false} strokeWidth={2} />
                <Line type="monotone" dataKey="mem" name="Mem %" stroke="#f43f5e" dot={false} strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="text-sm">Network (KB/s)</CardTitle>
          </CardHeader>
          <CardContent className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis dataKey="i" hide />
                <YAxis width={40} stroke="rgba(255,255,255,0.35)" />
                <Tooltip
                  contentStyle={{ background: "#111", border: "1px solid #222" }}
                  labelStyle={{ color: "#aaa" }}
                />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="netIn"
                  name="IN KB/s"
                  stroke="#a855f7"
                  fill="rgba(168,85,247,0.15)"
                  strokeWidth={2}
                />
                <Area
                  type="monotone"
                  dataKey="netOut"
                  name="OUT KB/s"
                  stroke="#10b981"
                  fill="rgba(16,185,129,0.12)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function MetricCard(props: {
  title: string;
  value: string;
  sub?: string;
  pct: number;
  tone: "emerald" | "rose" | "sky";
}) {
  const color =
    props.tone === "emerald" ? "bg-emerald-500" : props.tone === "rose" ? "bg-rose-500" : "bg-sky-500";
  return (
    <Card className="border-border bg-card">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">{props.title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="text-2xl font-semibold tracking-tight">{props.value}</div>
        {props.sub ? <div className="text-xs text-muted-foreground">{props.sub}</div> : null}
        <div className="h-2 w-full overflow-hidden rounded bg-muted">
          <div
            className={cn("h-2 rounded", color)}
            style={{ width: `${Math.min(100, Math.max(0, props.pct))}%` }}
          />
        </div>
      </CardContent>
    </Card>
  );
}

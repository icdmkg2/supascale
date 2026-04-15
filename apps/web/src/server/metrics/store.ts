import type { ScrapeState } from "@/server/metrics/prometheus";
import { parseNodeExporter } from "@/server/metrics/prometheus";

export type MetricPoint = {
  time: number;
  cpu: number | null;
  mem: number | null;
  netIn: number | null;
  netOut: number | null;
};

let paused = false;
let lastNet: ScrapeState | undefined;
const history: MetricPoint[] = [];
const MAX = 150;

let lastPayload: {
  parsed: ReturnType<typeof parseNodeExporter>;
  history: MetricPoint[];
} | null = null;

export function setMetricsPaused(p: boolean) {
  paused = p;
}

export function getMetricsPaused() {
  return paused;
}

export async function scrapeMetrics() {
  if (paused && lastPayload) {
    return { ...lastPayload, paused: true };
  }

  const url = process.env.NODE_EXPORTER_URL || "http://127.0.0.1:9100/metrics";
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`node_exporter HTTP ${res.status}`);
  const text = await res.text();
  const parsed = parseNodeExporter(text, lastNet);
  lastNet = parsed.rawNet ?? lastNet;

  const memPct =
    parsed.memUsedBytes != null && parsed.memTotalBytes != null && parsed.memTotalBytes > 0
      ? (100 * parsed.memUsedBytes) / parsed.memTotalBytes
      : null;

  const point: MetricPoint = {
    time: Date.now(),
    cpu: parsed.cpuPercent,
    mem: memPct,
    netIn: parsed.netInBps,
    netOut: parsed.netOutBps,
  };

  if (!paused) {
    history.push(point);
    while (history.length > MAX) history.shift();
  }

  lastPayload = { parsed, history: [...history] };
  return { parsed, history: [...history], paused: getMetricsPaused() };
}

import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth/guard";
import { getMetricsPaused, scrapeMetrics, setMetricsPaused } from "@/server/metrics/store";

export const runtime = "nodejs";

export async function GET() {
  const session = await requireSession();
  if (session instanceof Response) return session;
  try {
    const { parsed, history, paused: p } = await scrapeMetrics();
    return NextResponse.json({
      paused: p,
      host: {
        hostname: parsed.hostname,
        os: parsed.osPretty,
        cpuModel: parsed.cpuModel,
        cores: parsed.cores,
        uptimeSec: parsed.uptimeSec,
      },
      snapshot: {
        cpuPercent: parsed.cpuPercent,
        memUsedBytes: parsed.memUsedBytes,
        memTotalBytes: parsed.memTotalBytes,
        diskUsedPercent: parsed.diskUsedPercent,
        netInBps: parsed.netInBps,
        netOutBps: parsed.netOutBps,
      },
      history,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "metrics unavailable";
    return NextResponse.json({ error: msg }, { status: 503 });
  }
}

export async function POST(request: Request) {
  const session = await requireSession();
  if (session instanceof Response) return session;
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const paused = Boolean((json as { paused?: boolean }).paused);
  setMetricsPaused(paused);
  return NextResponse.json({ ok: true, paused });
}

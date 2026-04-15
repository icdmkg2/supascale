/** Minimal Prometheus text parser for node_exporter essentials */

function metricValue(line: string) {
  const parts = line.trim().split(/\s+/);
  const v = Number(parts.at(-1));
  return Number.isNaN(v) ? null : v;
}

function parseCpuIdleTotal(lines: string[]) {
  let idle = 0;
  let total = 0;
  for (const line of lines) {
    if (!line.startsWith("node_cpu_seconds_total")) continue;
    const v = metricValue(line);
    if (v == null) continue;
    total += v;
    if (line.includes('mode="idle"')) idle += v;
  }
  if (total === 0) return null;
  return 100 * (1 - idle / total);
}

export type ScrapeState = { netRx: number; netTx: number; t: number };

export function parseNodeExporter(text: string, prev?: ScrapeState) {
  const lines = text.split("\n");

  const cpuPercent = parseCpuIdleTotal(lines);

  const memTotal = lines.find((l) => l.startsWith("node_memory_MemTotal_bytes"))?.split(/\s+/).at(-1);
  const memAvail = lines.find((l) => l.startsWith("node_memory_MemAvailable_bytes"))?.split(/\s+/).at(-1);
  const memTotalBytes = memTotal ? Number(memTotal) : null;
  const memAvailBytes = memAvail ? Number(memAvail) : null;
  const memUsedBytes =
    memTotalBytes != null && memAvailBytes != null ? Math.max(0, memTotalBytes - memAvailBytes) : null;

  const fsSizeLine =
    lines.find((l) => l.startsWith("node_filesystem_size_bytes") && l.includes('mountpoint="/"')) ??
    lines.find((l) => l.startsWith("node_filesystem_size_bytes"));
  const fsAvailLine =
    lines.find((l) => l.startsWith("node_filesystem_avail_bytes") && l.includes('mountpoint="/"')) ??
    lines.find((l) => l.startsWith("node_filesystem_avail_bytes"));
  const fsSize = fsSizeLine ? metricValue(fsSizeLine) : null;
  const fsAvail = fsAvailLine ? metricValue(fsAvailLine) : null;
  const diskUsedPercent =
    fsSize != null && fsAvail != null && fsSize > 0 ? 100 * (1 - fsAvail / fsSize) : null;

  const rxLine =
    lines.find((l) => l.startsWith("node_network_receive_bytes_total") && l.includes("eth0")) ??
    lines.find((l) => l.startsWith("node_network_receive_bytes_total"));
  const txLine =
    lines.find((l) => l.startsWith("node_network_transmit_bytes_total") && l.includes("eth0")) ??
    lines.find((l) => l.startsWith("node_network_transmit_bytes_total"));
  const netRx = rxLine ? metricValue(rxLine) : null;
  const netTx = txLine ? metricValue(txLine) : null;

  const now = Date.now();
  let netInBps: number | null = null;
  let netOutBps: number | null = null;
  let rawNet: ScrapeState | undefined;
  if (prev && netRx != null && netTx != null) {
    const dt = (now - prev.t) / 1000;
    if (dt > 0) {
      netInBps = Math.max(0, (netRx - prev.netRx) / dt);
      netOutBps = Math.max(0, (netTx - prev.netTx) / dt);
    }
    rawNet = { netRx, netTx, t: now };
  } else if (netRx != null && netTx != null) {
    rawNet = { netRx, netTx, t: now };
  }

  const uname = lines.find((l) => l.startsWith("node_uname_info"));
  const hostname = uname?.match(/nodename="([^"]+)"/)?.[1] ?? null;
  const osLine = lines.find((l) => l.startsWith("node_os_info"));
  const osPretty = osLine?.match(/pretty_name="([^"]+)"/)?.[1] ?? null;

  const timeLine = lines.find((l) => l.startsWith("node_time_seconds") && !l.startsWith("node_timex"));
  const bootLine = lines.find((l) => l.startsWith("node_boot_time_seconds"));
  const t1 = timeLine ? metricValue(timeLine) : null;
  const t0 = bootLine ? metricValue(bootLine) : null;
  const uptimeSec = t1 != null && t0 != null ? t1 - t0 : null;

  const cpu0 = lines.find((l) => l.startsWith("node_cpu_info") && l.includes('cpu="0"'));
  const cpuModel = cpu0?.match(/model_name="([^"]+)"/)?.[1] ?? null;
  const cores = new Set(
    lines.filter((l) => l.startsWith("node_cpu_seconds_total") && l.includes("cpu=")).map((l) => {
      const m = l.match(/cpu="(\d+)"/);
      return m?.[1] ?? "";
    }),
  ).size;

  return {
    cpuPercent,
    memUsedBytes,
    memTotalBytes,
    diskUsedPercent,
    netInBps,
    netOutBps,
    hostname,
    osPretty,
    uptimeSec,
    cpuModel,
    cores: cores || null,
    rawNet,
  };
}

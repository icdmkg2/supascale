import fs from "fs/promises";
import path from "path";
import crypto from "crypto";
import { getProjectDir } from "@/server/paths";

const RAW_BASE = "https://raw.githubusercontent.com/supabase/supabase/master/docker";

async function fetchText(url: string) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`);
  return res.text();
}

/** Paths under `docker/` on the Supabase repo — must exist as real files or Docker creates empty dirs and Postgres fails. */
const UPSTREAM_VOLUME_FILES = [
  "volumes/db/realtime.sql",
  "volumes/db/webhooks.sql",
  "volumes/db/roles.sql",
  "volumes/db/jwt.sql",
  "volumes/db/_supabase.sql",
  "volumes/db/logs.sql",
  "volumes/db/pooler.sql",
  "volumes/logs/vector.yml",
  "volumes/pooler/pooler.exs",
] as const;

async function writeProjectTextFile(projectRoot: string, relativePath: string, content: string) {
  const full = path.join(projectRoot, relativePath);
  try {
    const st = await fs.stat(full);
    if (st.isDirectory()) await fs.rm(full, { recursive: true });
  } catch (e) {
    const err = e as NodeJS.ErrnoException;
    if (err.code !== "ENOENT") throw e;
  }
  await fs.mkdir(path.dirname(full), { recursive: true });
  await fs.writeFile(full, content, "utf8");
}

async function fetchUpstreamVolumeFiles(projectRoot: string) {
  await Promise.all(
    UPSTREAM_VOLUME_FILES.map(async (rel) => {
      const text = await fetchText(`${RAW_BASE}/${rel}`);
      await writeProjectTextFile(projectRoot, rel, text);
    }),
  );
}

function randomSecret(bytes = 32) {
  return crypto.randomBytes(bytes).toString("base64url");
}

export type TraefikComposeOpts = {
  slug: string;
  kongHost: string;
  studioHost?: string | null;
  tls: boolean;
  entrypoint: string;
  websecureEntrypoint: string;
  certResolver?: string | null;
  traefikNetwork: string;
};

export function buildTraefikOverride(opts: TraefikComposeOpts) {
  const rKong = `supascale_${opts.slug}_kong`;
  const ep = opts.tls ? opts.websecureEntrypoint : opts.entrypoint;

  const kongLabels: string[] = [
    "traefik.enable=true",
    `traefik.docker.network=${opts.traefikNetwork}`,
    `traefik.http.services.${rKong}.loadbalancer.server.port=8000`,
    `traefik.http.routers.${rKong}.rule=Host(\`${opts.kongHost}\`)`,
    `traefik.http.routers.${rKong}.entrypoints=${ep}`,
  ];
  if (opts.tls && opts.certResolver) {
    kongLabels.push(`traefik.http.routers.${rKong}.tls=true`);
    kongLabels.push(`traefik.http.routers.${rKong}.tls.certresolver=${opts.certResolver}`);
  }

  const lines: string[] = ["services:", "  kong:", "    networks:", "      default:", "      traefik:", "    ports: []", "    labels:"];
  for (const l of kongLabels) {
    lines.push(`      - "${l}"`);
  }

  if (opts.studioHost && opts.studioHost !== opts.kongHost) {
    const rStudio = `supascale_${opts.slug}_studio`;
    const epS = opts.tls ? opts.websecureEntrypoint : opts.entrypoint;
    const studioLabels: string[] = [
      "traefik.enable=true",
      `traefik.docker.network=${opts.traefikNetwork}`,
      `traefik.http.services.${rStudio}.loadbalancer.server.port=3000`,
      `traefik.http.routers.${rStudio}.rule=Host(\`${opts.studioHost}\`)`,
      `traefik.http.routers.${rStudio}.entrypoints=${epS}`,
    ];
    if (opts.tls && opts.certResolver) {
      studioLabels.push(`traefik.http.routers.${rStudio}.tls=true`);
      studioLabels.push(`traefik.http.routers.${rStudio}.tls.certresolver=${opts.certResolver}`);
    }
    lines.push("  studio:");
    lines.push("    networks:");
    lines.push("      default:");
    lines.push("      traefik:");
    lines.push("    labels:");
    for (const l of studioLabels) {
      lines.push(`      - "${l}"`);
    }
  }

  lines.push("networks:");
  lines.push("  traefik:");
  lines.push("    external: true");
  lines.push(`    name: ${opts.traefikNetwork}`);

  return `${lines.join("\n")}\n`;
}

function patchEnv(content: string, hosts: { apiUrl: string; publicUrl: string; siteUrl: string }) {
  const out: string[] = [];
  for (const line of content.split("\n")) {
    if (line.startsWith("POSTGRES_PASSWORD=")) {
      out.push(`POSTGRES_PASSWORD=${randomSecret(48)}`);
      continue;
    }
    if (line.startsWith("JWT_SECRET=")) {
      out.push(`JWT_SECRET=${randomSecret(48)}`);
      continue;
    }
    if (line.startsWith("PG_META_CRYPTO_KEY=")) {
      out.push(`PG_META_CRYPTO_KEY=${randomSecret(24)}`);
      continue;
    }
    if (line.startsWith("SECRET_KEY_BASE=")) {
      out.push(`SECRET_KEY_BASE=${randomSecret(32)}`);
      continue;
    }
    if (line.startsWith("VAULT_ENC_KEY=")) {
      out.push(`VAULT_ENC_KEY=${randomSecret(16).slice(0, 32)}`);
      continue;
    }
    if (line.startsWith("LOGFLARE_PUBLIC_ACCESS_TOKEN=")) {
      out.push(`LOGFLARE_PUBLIC_ACCESS_TOKEN=${randomSecret(32)}`);
      continue;
    }
    if (line.startsWith("LOGFLARE_PRIVATE_ACCESS_TOKEN=")) {
      out.push(`LOGFLARE_PRIVATE_ACCESS_TOKEN=${randomSecret(32)}`);
      continue;
    }
    if (line.startsWith("SUPABASE_PUBLIC_URL=")) {
      out.push(`SUPABASE_PUBLIC_URL=${hosts.publicUrl}`);
      continue;
    }
    if (line.startsWith("API_EXTERNAL_URL=")) {
      out.push(`API_EXTERNAL_URL=${hosts.apiUrl}`);
      continue;
    }
    if (line.startsWith("SITE_URL=")) {
      out.push(`SITE_URL=${hosts.siteUrl}`);
      continue;
    }
    out.push(line);
  }
  return out.join("\n");
}

export async function writeSupabaseStack(opts: { slug: string; kongHost: string; studioHost?: string | null }) {
  const dir = getProjectDir(opts.slug);
  await fs.mkdir(dir, { recursive: true });

  const [compose, envExample, kongYml, kongEntry] = await Promise.all([
    fetchText(`${RAW_BASE}/docker-compose.yml`),
    fetchText(`${RAW_BASE}/.env.example`),
    fetchText(`${RAW_BASE}/volumes/api/kong.yml`),
    fetchText(`${RAW_BASE}/volumes/api/kong-entrypoint.sh`),
  ]);

  const nameLine = compose.replace(/^name:\s*.*$/m, `name: supascale_${opts.slug}`);
  await fs.writeFile(path.join(dir, "docker-compose.yml"), nameLine, "utf8");

  const apiUrl = opts.kongHost.includes("://") ? opts.kongHost : `http://${opts.kongHost}`;
  const publicUrl = apiUrl;
  const siteUrl = opts.studioHost
    ? opts.studioHost.includes("://")
      ? opts.studioHost
      : `http://${opts.studioHost}`
    : publicUrl;

  const envContent = patchEnv(envExample, {
    apiUrl,
    publicUrl,
    siteUrl,
  });
  await fs.writeFile(path.join(dir, ".env"), envContent, "utf8");

  await fs.mkdir(path.join(dir, "volumes", "api"), { recursive: true });
  await fs.writeFile(path.join(dir, "volumes", "api", "kong.yml"), kongYml, "utf8");
  await fs.writeFile(path.join(dir, "volumes", "api", "kong-entrypoint.sh"), kongEntry, "utf8");

  const volDirs = [
    "volumes/db/data",
    "volumes/storage",
    "volumes/functions",
    "volumes/logs",
    "volumes/snippets",
    "volumes/pooler",
  ];
  for (const v of volDirs) {
    await fs.mkdir(path.join(dir, v), { recursive: true });
  }

  await fetchUpstreamVolumeFiles(dir);

  return { dir };
}

export async function writeTraefikComposeFile(slug: string, opts: TraefikComposeOpts) {
  const dir = getProjectDir(slug);
  const body = buildTraefikOverride(opts);
  await fs.writeFile(path.join(dir, "docker-compose.traefik.yml"), body, "utf8");
}

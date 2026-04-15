import { nanoid } from "nanoid";
import { desc, eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import * as schema from "@/lib/db/schema";
import { writeSupabaseStack, writeTraefikComposeFile } from "@/server/supabase/bootstrap";
import { resolveTraefikSettings } from "@/server/settings/traefik";
import { dockerCompose, type ComposeResult } from "@/server/docker/compose";
import { getProjectDir } from "@/server/paths";
import { patchProjectEnv } from "@/server/projects/routing";

const slugRe = /^[a-z][a-z0-9-]{1,62}$/;

const MAX_LAST_ERROR = 16_000;

function clipError(msg: string): string {
  const t = msg.trim();
  if (!t) return "(no output)";
  if (t.length <= MAX_LAST_ERROR) return t;
  return `${t.slice(0, MAX_LAST_ERROR)}\n…(truncated)`;
}

function composeFailureMessage(up: ComposeResult): string {
  const raw = [up.stderr, up.stdout].filter(Boolean).join("\n").trim();
  return raw ? clipError(raw) : clipError(`docker compose exited with code ${up.code}`);
}

export function assertValidSlug(slug: string) {
  if (!slugRe.test(slug)) {
    throw new Error("Invalid slug: use lowercase letters, numbers, hyphen (2–63 chars).");
  }
}

export function listProjects() {
  const db = getDb();
  return db.select().from(schema.projects).orderBy(desc(schema.projects.createdAt)).all();
}

export function getProjectBySlug(slug: string) {
  const db = getDb();
  return db.select().from(schema.projects).where(eq(schema.projects.slug, slug)).get();
}

export async function createProject(input: {
  name: string;
  slug: string;
  kongHost: string;
  studioHost?: string | null;
  tls: boolean;
  servicePreferences?: Record<string, boolean>;
}) {
  assertValidSlug(input.slug);
  const id = nanoid();
  const now = new Date();
  const composeDir = getProjectDir(input.slug);
  const db = getDb();

  db.insert(schema.projects)
    .values({
      id,
      slug: input.slug,
      name: input.name,
      composeDir,
      status: "provisioning",
      kongHost: input.kongHost,
      studioHost: input.studioHost ?? null,
      tlsEnabled: input.tls,
      createdAt: now,
      updatedAt: now,
    })
    .run();

  try {
    await writeSupabaseStack({
      slug: input.slug,
      kongHost: input.kongHost,
      studioHost: input.studioHost ?? null,
    });

    const tf = resolveTraefikSettings();
    await writeTraefikComposeFile(input.slug, {
      slug: input.slug,
      kongHost: input.kongHost,
      studioHost: input.studioHost ?? null,
      tls: input.tls,
      entrypoint: tf.entrypoint,
      websecureEntrypoint: tf.websecureEntrypoint,
      certResolver: tf.certResolver,
      traefikNetwork: tf.traefikNetwork,
    });

    const up = await dockerCompose(composeDir, ["up", "-d", "--remove-orphans"]);
    const status = up.code === 0 ? "running" : "error";
    const lastError = up.code === 0 ? null : composeFailureMessage(up);

    db.update(schema.projects)
      .set({
        status,
        lastError,
        updatedAt: new Date(),
      })
      .where(eq(schema.projects.id, id))
      .run();

    db.insert(schema.auditLogs)
      .values({
        id: nanoid(),
        action: "project.create",
        detail: JSON.stringify({
          slug: input.slug,
          exit: up.code,
          log: up.stderr || up.stdout,
          servicePreferences: input.servicePreferences,
        }),
        userId: null,
        createdAt: new Date(),
      })
      .run();

    return {
      id,
      status,
      logs: up.stdout + up.stderr,
      lastError,
    };
  } catch (e) {
    const errText = clipError(e instanceof Error ? e.message : String(e));
    db.update(schema.projects)
      .set({ status: "error", lastError: errText, updatedAt: new Date() })
      .where(eq(schema.projects.id, id))
      .run();
    throw e;
  }
}

export async function startProject(slug: string) {
  const dir = getProjectDir(slug);
  const up = await dockerCompose(dir, ["up", "-d", "--remove-orphans"]);
  const db = getDb();
  const ok = up.code === 0;
  db.update(schema.projects)
    .set({
      status: ok ? "running" : "error",
      lastError: ok ? null : composeFailureMessage(up),
      updatedAt: new Date(),
    })
    .where(eq(schema.projects.slug, slug))
    .run();
  return up;
}

export async function updateProjectRouting(
  slug: string,
  input: { kongHost: string; studioHost?: string | null; tls: boolean },
) {
  const apiUrl = input.kongHost.includes("://") ? input.kongHost : `http://${input.kongHost}`;
  const publicUrl = apiUrl;
  const siteUrl = input.studioHost
    ? input.studioHost.includes("://")
      ? input.studioHost
      : `http://${input.studioHost}`
    : publicUrl;

  await patchProjectEnv(slug, { apiUrl, publicUrl, siteUrl });

  const tf = resolveTraefikSettings();
  await writeTraefikComposeFile(slug, {
    slug,
    kongHost: input.kongHost,
    studioHost: input.studioHost ?? null,
    tls: input.tls,
    entrypoint: tf.entrypoint,
    websecureEntrypoint: tf.websecureEntrypoint,
    certResolver: tf.certResolver,
    traefikNetwork: tf.traefikNetwork,
  });

  const dir = getProjectDir(slug);
  const up = await dockerCompose(dir, ["up", "-d", "--remove-orphans"]);

  const db = getDb();
  const ok = up.code === 0;
  db.update(schema.projects)
    .set({
      kongHost: input.kongHost,
      studioHost: input.studioHost ?? null,
      tlsEnabled: input.tls,
      status: ok ? "running" : "error",
      lastError: ok ? null : composeFailureMessage(up),
      updatedAt: new Date(),
    })
    .where(eq(schema.projects.slug, slug))
    .run();

  return up;
}

export async function stopProject(slug: string) {
  const dir = getProjectDir(slug);
  const down = await dockerCompose(dir, ["down"]);
  const db = getDb();
  const ok = down.code === 0;
  db.update(schema.projects)
    .set({
      status: ok ? "stopped" : "error",
      lastError: ok ? null : composeFailureMessage(down),
      updatedAt: new Date(),
    })
    .where(eq(schema.projects.slug, slug))
    .run();
  return down;
}

import { nanoid } from "nanoid";
import { asc, desc, eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import * as schema from "@/lib/db/schema";
import { dockerCompose } from "@/server/docker/compose";
import { getProjectDir } from "@/server/paths";

export function listTasks(limit = 200) {
  const db = getDb();
  return db.select().from(schema.tasks).orderBy(desc(schema.tasks.createdAt)).limit(limit).all();
}

export function enqueueTask(input: {
  projectId?: string | null;
  type: string;
  payload?: unknown;
}) {
  const db = getDb();
  const id = nanoid();
  const now = new Date();
  db.insert(schema.tasks)
    .values({
      id,
      projectId: input.projectId ?? null,
      type: input.type,
      status: "pending",
      payload: input.payload ? JSON.stringify(input.payload) : null,
      createdAt: now,
      updatedAt: now,
    })
    .run();
  return id;
}

export async function processTasksOnce() {
  const db = getDb();
  const pending = db
    .select()
    .from(schema.tasks)
    .where(eq(schema.tasks.status, "pending"))
    .orderBy(asc(schema.tasks.createdAt))
    .limit(5)
    .all();

  for (const t of pending) {
    db.update(schema.tasks)
      .set({ status: "running", updatedAt: new Date() })
      .where(eq(schema.tasks.id, t.id))
      .run();
    try {
      let result = "ok";
      if (t.type === "compose_pull" && t.payload) {
        const slug = (JSON.parse(t.payload) as { slug: string }).slug;
        const dir = getProjectDir(slug);
        const r = await dockerCompose(dir, ["pull"]);
        result = `exit=${r.code}\n${r.stderr || r.stdout}`;
      } else if (t.type === "backup" && t.payload) {
        const slug = (JSON.parse(t.payload) as { slug: string }).slug;
        result = `backup scheduled for ${slug} (use pg_dump via db container for full dumps)`;
      } else if (t.type === "noop") {
        result = "noop";
      } else {
        result = `unhandled:${t.type}`;
      }

      db.update(schema.tasks)
        .set({ status: "done", result, updatedAt: new Date() })
        .where(eq(schema.tasks.id, t.id))
        .run();
    } catch (e) {
      db.update(schema.tasks)
        .set({
          status: "failed",
          error: e instanceof Error ? e.message : String(e),
          updatedAt: new Date(),
        })
        .where(eq(schema.tasks.id, t.id))
        .run();
    }
  }
}

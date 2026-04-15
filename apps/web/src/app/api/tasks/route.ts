import { NextResponse } from "next/server";
import { z } from "zod";
import { requireSession } from "@/lib/auth/guard";
import { enqueueTask, listTasks } from "@/server/tasks/service";

export const runtime = "nodejs";

export async function GET() {
  const session = await requireSession();
  if (session instanceof Response) return session;
  return NextResponse.json({ tasks: listTasks() });
}

const bodySchema = z.object({
  type: z.enum(["compose_pull", "backup", "noop"]),
  projectId: z.string().optional().nullable(),
  slug: z.string().optional(),
});

export async function POST(request: Request) {
  const session = await requireSession();
  if (session instanceof Response) return session;
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const payload =
    parsed.data.type === "compose_pull" || parsed.data.type === "backup"
      ? { slug: parsed.data.slug ?? "" }
      : undefined;
  if ((parsed.data.type === "compose_pull" || parsed.data.type === "backup") && !parsed.data.slug) {
    return NextResponse.json({ error: "slug required" }, { status: 400 });
  }
  const id = enqueueTask({
    projectId: parsed.data.projectId ?? null,
    type: parsed.data.type,
    payload,
  });
  return NextResponse.json({ id });
}

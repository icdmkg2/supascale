import { NextResponse } from "next/server";
import { z } from "zod";
import { requireSession } from "@/lib/auth/guard";
import { createProject, listProjects } from "@/server/projects/service";

export const runtime = "nodejs";

export async function GET() {
  const session = await requireSession();
  if (session instanceof Response) return session;
  const rows = listProjects();
  return NextResponse.json({ projects: rows });
}

const createSchema = z.object({
  name: z.string().min(1).max(120),
  slug: z.string().min(2).max(63),
  kongHost: z.string().min(1),
  studioHost: z.string().optional().nullable(),
  tls: z.boolean().optional().default(false),
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
  const parsed = createSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  try {
    const result = await createProject({
      name: parsed.data.name,
      slug: parsed.data.slug,
      kongHost: parsed.data.kongHost,
      studioHost: parsed.data.studioHost ?? null,
      tls: parsed.data.tls,
    });
    return NextResponse.json(result);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Create failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

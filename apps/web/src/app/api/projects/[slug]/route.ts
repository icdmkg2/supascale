import { NextResponse } from "next/server";
import { z } from "zod";
import { requireSession } from "@/lib/auth/guard";
import { updateProjectRouting } from "@/server/projects/service";

export const runtime = "nodejs";

type Params = { slug: string };

const patchSchema = z.object({
  kongHost: z.string().min(1),
  studioHost: z.string().optional().nullable(),
  tls: z.boolean(),
});

export async function PATCH(request: Request, context: { params: Promise<Params> }) {
  const session = await requireSession();
  if (session instanceof Response) return session;
  const { slug } = await context.params;
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = patchSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  try {
    const res = await updateProjectRouting(slug, {
      kongHost: parsed.data.kongHost,
      studioHost: parsed.data.studioHost ?? null,
      tls: parsed.data.tls,
    });
    return NextResponse.json({ code: res.code, stdout: res.stdout, stderr: res.stderr });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Update failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

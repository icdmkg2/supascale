import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth/guard";
import { startProject } from "@/server/projects/service";

export const runtime = "nodejs";

type Params = { slug: string };

export async function POST(_request: Request, context: { params: Promise<Params> }) {
  const session = await requireSession();
  if (session instanceof Response) return session;
  const { slug } = await context.params;
  const res = await startProject(slug);
  return NextResponse.json({ code: res.code, stdout: res.stdout, stderr: res.stderr });
}

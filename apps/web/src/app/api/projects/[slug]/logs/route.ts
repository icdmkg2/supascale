import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth/guard";
import { dockerComposeLogs } from "@/server/docker/compose";
import { getProjectDir } from "@/server/paths";

export const runtime = "nodejs";

type Params = { slug: string };

export async function GET(request: Request, context: { params: Promise<Params> }) {
  const session = await requireSession();
  if (session instanceof Response) return session;
  const { slug } = await context.params;
  const url = new URL(request.url);
  const service = url.searchParams.get("service") ?? undefined;
  const dir = getProjectDir(slug);
  const res = await dockerComposeLogs(dir, service);
  if (res.code !== 0) {
    return NextResponse.json({ error: res.stderr || res.stdout }, { status: 500 });
  }
  return NextResponse.json({ logs: res.stdout });
}

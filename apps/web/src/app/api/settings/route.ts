import { NextResponse } from "next/server";
import { z } from "zod";
import { requireSession } from "@/lib/auth/guard";
import { getSetting, setSetting } from "@/lib/settings-store";

export const runtime = "nodejs";

const keys = [
  "traefik_network",
  "traefik_entrypoint",
  "traefik_entrypoint_websecure",
  "traefik_cert_resolver",
  "projects_root",
  /** "true" | "false" — poll compose logs in the new-project wizard during deploy */
  "deploy_debug_logs",
] as const;

export async function GET() {
  const session = await requireSession();
  if (session instanceof Response) return session;
  const out: Record<string, string | null> = {};
  for (const k of keys) {
    out[k] = getSetting(k);
  }
  return NextResponse.json({ settings: out });
}

const postSchema = z.object({
  traefik_network: z.string().optional(),
  traefik_entrypoint: z.string().optional(),
  traefik_entrypoint_websecure: z.string().optional(),
  traefik_cert_resolver: z.string().optional().nullable(),
  deploy_debug_logs: z.boolean().optional(),
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
  const parsed = postSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  for (const [k, v] of Object.entries(parsed.data)) {
    if (v === undefined) continue;
    if (v === null) {
      setSetting(k, "");
    } else if (k === "deploy_debug_logs" && typeof v === "boolean") {
      setSetting("deploy_debug_logs", v ? "true" : "false");
    } else {
      setSetting(k, v as string);
    }
  }
  return NextResponse.json({ ok: true });
}

import fs from "fs/promises";
import path from "path";
import { getProjectDir } from "@/server/paths";

export async function patchProjectEnv(
  slug: string,
  hosts: { apiUrl: string; publicUrl: string; siteUrl: string },
) {
  const envPath = path.join(getProjectDir(slug), ".env");
  const content = await fs.readFile(envPath, "utf8");
  const out = content.split("\n").map((line) => {
    if (line.startsWith("SUPABASE_PUBLIC_URL=")) return `SUPABASE_PUBLIC_URL=${hosts.publicUrl}`;
    if (line.startsWith("API_EXTERNAL_URL=")) return `API_EXTERNAL_URL=${hosts.apiUrl}`;
    if (line.startsWith("SITE_URL=")) return `SITE_URL=${hosts.siteUrl}`;
    return line;
  });
  await fs.writeFile(envPath, out.join("\n"), "utf8");
}

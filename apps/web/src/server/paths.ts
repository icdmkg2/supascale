import path from "path";
import fs from "fs";

export function getProjectsRoot() {
  const root = process.env.PROJECTS_ROOT || path.join(process.cwd(), "data", "projects");
  if (!fs.existsSync(root)) {
    fs.mkdirSync(root, { recursive: true });
  }
  return root;
}

export function getProjectDir(slug: string) {
  return path.join(getProjectsRoot(), slug);
}

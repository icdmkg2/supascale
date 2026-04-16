import { spawn } from "child_process";
import path from "path";

export type ComposeResult = { code: number; stdout: string; stderr: string };

function run(cmd: string, args: string[], cwd: string): Promise<ComposeResult> {
  return new Promise((resolve) => {
    const chunks: Buffer[] = [];
    const errs: Buffer[] = [];
    const child = spawn(cmd, args, { cwd, shell: false });
    child.stdout.on("data", (d) => chunks.push(d));
    child.stderr.on("data", (d) => errs.push(d));
    child.on("close", (code) => {
      resolve({
        code: code ?? 1,
        stdout: Buffer.concat(chunks).toString("utf8"),
        stderr: Buffer.concat(errs).toString("utf8"),
      });
    });
  });
}

export async function dockerCompose(
  projectDir: string,
  composeArgs: string[],
): Promise<ComposeResult> {
  const yml = path.join(projectDir, "docker-compose.yml");
  const traefik = path.join(projectDir, "docker-compose.traefik.yml");
  const supascale = path.join(projectDir, "docker-compose.supascale.yml");
  const fs = await import("fs");
  const files = [yml];
  if (fs.existsSync(traefik)) {
    files.push(traefik);
  }
  if (fs.existsSync(supascale)) {
    files.push(supascale);
  }
  const args = ["compose", ...files.flatMap((f) => ["-f", f]), ...composeArgs];
  return run("docker", args, projectDir);
}

export async function dockerComposeLogs(projectDir: string, service?: string) {
  const tail = ["logs", "--no-color", "--tail", "400"];
  if (service) tail.push(service);
  return dockerCompose(projectDir, tail);
}

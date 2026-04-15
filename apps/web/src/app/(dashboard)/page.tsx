import { listRecentAuditLogs } from "@/server/audit";
import { listProjects } from "@/server/projects/service";
import { listTasks } from "@/server/tasks/service";
import { DashboardShell } from "./dashboard-shell";

export default function DashboardPage() {
  const projects = listProjects();
  const tasks = listTasks(500);
  const audit = listRecentAuditLogs(15);

  return (
    <DashboardShell
      initialProjects={JSON.parse(JSON.stringify(projects))}
      initialTasks={JSON.parse(JSON.stringify(tasks))}
      initialAudit={JSON.parse(JSON.stringify(audit))}
    />
  );
}

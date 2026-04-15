import { AppShell } from "@/components/app-shell";
import { TasksClient } from "./tasks-client";

export default function TasksPage() {
  return (
    <AppShell title="Tasks" subtitle="Background jobs for deploys, pulls, and backups" breadcrumb="Tasks">
      <TasksClient />
    </AppShell>
  );
}

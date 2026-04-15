import { AppShell } from "@/components/app-shell";
import { LogsClient } from "./logs-client";

export default function LogsPage() {
  return (
    <AppShell title="Logs" subtitle="Tail compose logs for a project stack" breadcrumb="Logs">
      <LogsClient />
    </AppShell>
  );
}

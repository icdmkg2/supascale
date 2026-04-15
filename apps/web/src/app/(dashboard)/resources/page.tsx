import { AppShell } from "@/components/app-shell";
import { ResourcesClient } from "./resources-client";

export default function ResourcesPage() {
  return (
    <AppShell
      title="Resources"
      subtitle="Monitor server resources, processes, and system health"
      breadcrumb="Resources"
    >
      <ResourcesClient />
    </AppShell>
  );
}

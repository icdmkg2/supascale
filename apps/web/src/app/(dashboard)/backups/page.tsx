import { AppShell } from "@/components/app-shell";
import { BackupsClient } from "./backups-client";

export default function BackupsPage() {
  return (
    <AppShell
      title="Backups"
      subtitle="Logical backup schedules per Supabase project"
      breadcrumb="Backups"
    >
      <BackupsClient />
    </AppShell>
  );
}

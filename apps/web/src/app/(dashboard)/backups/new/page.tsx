import { AppShell } from "@/components/app-shell";
import { NewBackupClient } from "./new-backup-client";

export default function NewBackupPage() {
  return (
    <AppShell
      title="New Backup"
      subtitle="Create a new backup policy and archive for a project"
      breadcrumb="New backup"
    >
      <NewBackupClient />
    </AppShell>
  );
}

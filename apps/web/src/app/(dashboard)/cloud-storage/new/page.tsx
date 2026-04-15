import { AppShell } from "@/components/app-shell";
import { AddStorageClient } from "./add-storage-client";

export default function AddStoragePage() {
  return (
    <AppShell
      title="Add Storage Provider"
      subtitle="Configure a new cloud storage provider for backups"
      breadcrumb="Add provider"
    >
      <AddStorageClient />
    </AppShell>
  );
}

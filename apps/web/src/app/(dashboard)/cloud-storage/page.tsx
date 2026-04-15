import { AppShell } from "@/components/app-shell";
import { StorageClient } from "./storage-client";

export default function CloudStoragePage() {
  return (
    <AppShell
      title="Cloud Storage"
      subtitle="S3-compatible destinations for backups (secrets stored encrypted server-side)"
      breadcrumb="Cloud Storage"
    >
      <StorageClient />
    </AppShell>
  );
}

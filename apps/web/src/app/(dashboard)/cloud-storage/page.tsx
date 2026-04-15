import Link from "next/link";
import { Plus } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { StorageClient } from "./storage-client";

export default function CloudStoragePage() {
  return (
    <AppShell
      title="Cloud Storage"
      subtitle="Configure external storage providers for backups and data export"
      breadcrumb="Cloud Storage"
      headerActions={
        <Link
          href="/cloud-storage/new"
          className={cn(buttonVariants({ variant: "default", size: "lg" }), "gap-2 shadow-sm")}
        >
          <Plus className="size-4" aria-hidden />
          Add Provider
        </Link>
      }
    >
      <StorageClient />
    </AppShell>
  );
}


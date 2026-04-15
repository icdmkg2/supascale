import Link from "next/link";
import { Plus } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { BackupsClient } from "./backups-client";

export default function BackupsPage() {
  return (
    <AppShell
      title="Backups"
      subtitle="Manage backups for your Supabase projects"
      breadcrumb="Backups"
      headerActions={
        <Link
          href="/backups/new"
          className={cn(buttonVariants({ variant: "default", size: "lg" }), "gap-2 shadow-sm")}
        >
          <Plus className="size-4" aria-hidden />
          New Backup
        </Link>
      }
    >
      <BackupsClient />
    </AppShell>
  );
}

import Link from "next/link";
import { Plus } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { DomainsClient } from "./domains-client";

export default function DomainsPage() {
  return (
    <AppShell
      title="Domains"
      subtitle="Manage custom domains and SSL certificates."
      breadcrumb="Domains"
      headerActions={
        <Link
          href="/projects"
          className={cn(buttonVariants({ variant: "default", size: "lg" }), "gap-2 shadow-sm")}
        >
          <Plus className="size-4" aria-hidden />
          New Project
        </Link>
      }
    >
      <DomainsClient />
    </AppShell>
  );
}


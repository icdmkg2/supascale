import Link from "next/link";
import { Plus } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { TasksClient } from "./tasks-client";

export default function TasksPage() {
  return (
    <AppShell
      title="Tasks"
      subtitle="Manage scheduled tasks for your projects"
      breadcrumb="Tasks"
      headerActions={
        <Link
          href="/tasks/new"
          className={cn(buttonVariants({ variant: "default", size: "lg" }), "gap-2 shadow-sm")}
        >
          <Plus className="size-4" aria-hidden />
          New Task
        </Link>
      }
    >
      <TasksClient />
    </AppShell>
  );
}

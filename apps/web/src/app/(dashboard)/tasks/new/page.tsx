import { AppShell } from "@/components/app-shell";
import { NewTaskClient } from "./new-task-client";

export default function NewTaskPage() {
  return (
    <AppShell
      title="New Task"
      subtitle="Create a new scheduled task for automated operations"
      breadcrumb="New task"
    >
      <NewTaskClient />
    </AppShell>
  );
}

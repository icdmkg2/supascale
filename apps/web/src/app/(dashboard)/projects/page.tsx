import { AppShell } from "@/components/app-shell";
import { ProjectsPanel } from "./projects-panel";

export default function ProjectsPage() {
  return (
    <AppShell
      title="Projects"
      subtitle="Provision Supabase stacks with Docker Compose and Traefik labels"
      breadcrumb="Projects"
    >
      <ProjectsPanel />
    </AppShell>
  );
}

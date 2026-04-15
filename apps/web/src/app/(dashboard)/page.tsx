import { AppShell } from "@/components/app-shell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function DashboardPage() {
  return (
    <AppShell
      title="Dashboard"
      subtitle="Overview of your Supabase stacks and system status"
      breadcrumb="Dashboard"
    >
      <div className="grid auto-rows-fr gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <Card className="flex h-full min-h-[140px] flex-col border-border bg-card">
          <CardHeader className="space-y-1.5">
            <CardTitle>Projects</CardTitle>
            <CardDescription>Provision and manage Supabase Docker stacks</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 text-sm leading-relaxed text-muted-foreground">
            Create isolated compose projects with Traefik labels for Kong and Studio.
          </CardContent>
        </Card>
        <Card className="flex h-full min-h-[140px] flex-col border-border bg-card">
          <CardHeader className="space-y-1.5">
            <CardTitle>Resources</CardTitle>
            <CardDescription>Host CPU, memory, disk, and network</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 text-sm leading-relaxed text-muted-foreground">
            Metrics are collected via Prometheus node_exporter when configured in compose.
          </CardContent>
        </Card>
        <Card className="flex h-full min-h-[140px] flex-col border-border bg-card">
          <CardHeader className="space-y-1.5">
            <CardTitle>Domains</CardTitle>
            <CardDescription>Traefik router labels</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 text-sm leading-relaxed text-muted-foreground">
            Map hostnames to your edge service without replacing your existing Traefik.
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}

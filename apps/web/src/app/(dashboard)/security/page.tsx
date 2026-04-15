import { AppShell } from "@/components/app-shell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function SecurityPage() {
  return (
    <AppShell
      title="Security"
      subtitle="Review access, secrets, and exposure for your SupaScale deployment"
      breadcrumb="Security"
    >
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle>Security checklist</CardTitle>
          <CardDescription>
            Use Settings for TLS and Traefik, keep the panel on a private network, and rotate{" "}
            <code className="text-xs">SESSION_SECRET</code> if it may have leaked.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          This section is a placeholder for future RLS audits, API key rotation, and compose hardening tips.
        </CardContent>
      </Card>
    </AppShell>
  );
}

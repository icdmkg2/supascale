import { AppShell } from "@/components/app-shell";
import { SettingsClient } from "./settings-client";

export default function SettingsPage() {
  return (
    <AppShell
      title="Settings"
      subtitle="Traefik defaults and platform paths"
      breadcrumb="Settings"
    >
      <SettingsClient />
    </AppShell>
  );
}

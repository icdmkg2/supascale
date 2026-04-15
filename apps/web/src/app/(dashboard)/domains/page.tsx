import { AppShell } from "@/components/app-shell";
import { DomainsClient } from "./domains-client";

export default function DomainsPage() {
  return (
    <AppShell
      title="Domains"
      subtitle="Traefik router labels for Kong (API) and optional Studio"
      breadcrumb="Domains"
    >
      <DomainsClient />
    </AppShell>
  );
}

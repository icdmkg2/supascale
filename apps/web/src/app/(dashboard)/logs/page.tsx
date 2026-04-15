import { AppShell } from "@/components/app-shell";
import { LogsClient } from "./logs-client";

export default async function LogsPage({
  searchParams,
}: {
  searchParams: Promise<{ slug?: string }>;
}) {
  const { slug } = await searchParams;
  return (
    <AppShell title="Logs" subtitle="Tail compose logs for a project stack" breadcrumb="Logs">
      <LogsClient initialSlug={slug} />
    </AppShell>
  );
}

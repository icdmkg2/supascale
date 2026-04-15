import type { ReactNode } from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { AppHeader } from "@/components/app-header";
import { TooltipProvider } from "@/components/ui/tooltip";

type AppShellProps = {
  title: string;
  subtitle?: string;
  breadcrumb?: string;
  /** Extra controls in the header row (e.g. primary actions). */
  headerActions?: ReactNode;
  /** When false, breadcrumb trail is hidden. */
  showBreadcrumb?: boolean;
  children: ReactNode;
};

/** Full-viewport shell: sidebar + column use 100dvh; main scrolls inside. */
export function AppShell({
  title,
  subtitle,
  breadcrumb,
  headerActions,
  showBreadcrumb = true,
  children,
}: AppShellProps) {
  return (
    <TooltipProvider>
      <div className="flex h-[100dvh] max-h-[100dvh] min-h-0 w-full flex-col overflow-hidden bg-background md:flex-row">
        <AppSidebar />
        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
          <AppHeader
            title={title}
            subtitle={subtitle}
            breadcrumb={breadcrumb}
            headerActions={headerActions}
            showBreadcrumb={showBreadcrumb}
          />
          <main className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden bg-background px-6 py-6 sm:px-8">
            {children}
          </main>
        </div>
      </div>
    </TooltipProvider>
  );
}

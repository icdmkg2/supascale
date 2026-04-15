import { AppSidebar } from "@/components/app-sidebar";
import { AppHeader } from "@/components/app-header";
import { TooltipProvider } from "@/components/ui/tooltip";

type AppShellProps = {
  title: string;
  subtitle?: string;
  breadcrumb?: string;
  children: React.ReactNode;
};

export function AppShell({ title, subtitle, breadcrumb, children }: AppShellProps) {
  return (
    <TooltipProvider>
      <div className="flex min-h-screen bg-background">
        <AppSidebar />
        <div className="flex min-h-screen flex-1 flex-col">
          <AppHeader title={title} subtitle={subtitle} breadcrumb={breadcrumb} />
          <main className="flex-1 px-8 py-6">{children}</main>
        </div>
      </div>
    </TooltipProvider>
  );
}

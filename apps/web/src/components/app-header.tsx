import type { ReactNode } from "react";
import Link from "next/link";
import { Bell, CircleUser, Monitor, Home, Search } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

type AppHeaderProps = {
  title: string;
  subtitle?: string;
  breadcrumb?: string;
  headerActions?: ReactNode;
  showBreadcrumb?: boolean;
};

export function AppHeader({
  title,
  subtitle,
  breadcrumb,
  headerActions,
  showBreadcrumb = true,
}: AppHeaderProps) {
  const crumb = breadcrumb ?? title;
  return (
    <header className="shrink-0 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="flex flex-col gap-4 px-6 py-5 sm:flex-row sm:items-start sm:justify-between sm:px-8 sm:py-6">
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground md:text-3xl">{title}</h1>
          {subtitle ? (
            <p className="mt-1.5 max-w-3xl text-sm leading-relaxed text-muted-foreground">{subtitle}</p>
          ) : null}
          {showBreadcrumb ? (
            <Breadcrumb className="mt-4">
              <BreadcrumbList className="text-xs text-muted-foreground">
                <BreadcrumbItem>
                  <Link
                    href="/"
                    className="inline-flex items-center gap-1.5 text-muted-foreground transition-colors hover:text-foreground"
                  >
                    <Home className="h-3.5 w-3.5" />
                    <span className="sr-only">Home</span>
                  </Link>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage className="font-medium text-foreground/90">{crumb}</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          ) : null}
        </div>
        <div className="flex shrink-0 flex-wrap items-center justify-end gap-2 self-start sm:items-center sm:gap-3">
          {headerActions}
          <Button type="button" variant="ghost" size="icon" className="h-9 w-9" aria-label="Search (coming soon)">
            <Search className="h-4 w-4" />
          </Button>
          <ThemeToggle />
          <Button type="button" variant="ghost" size="icon" className="h-9 w-9" aria-label="Display">
            <Monitor className="h-4 w-4" />
          </Button>
          <Button type="button" variant="ghost" size="icon" className="h-9 w-9" aria-label="Notifications">
            <Bell className="h-4 w-4" />
          </Button>
          <Button type="button" variant="ghost" size="icon" className="h-9 w-9" aria-label="Account">
            <CircleUser className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </header>
  );
}

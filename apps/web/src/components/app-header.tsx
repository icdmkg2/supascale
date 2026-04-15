import Link from "next/link";
import { Monitor, Home } from "lucide-react";
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
};

export function AppHeader({ title, subtitle, breadcrumb }: AppHeaderProps) {
  const crumb = breadcrumb ?? title;
  return (
    <header className="border-b border-border bg-background/80 backdrop-blur">
      <div className="flex items-start justify-between gap-4 px-8 py-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">{title}</h1>
          {subtitle ? <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p> : null}
          <Breadcrumb className="mt-3">
            <BreadcrumbList className="text-xs text-muted-foreground">
              <BreadcrumbItem>
                <Link
                  href="/"
                  className="inline-flex items-center gap-1 text-muted-foreground transition-colors hover:text-foreground"
                >
                  <Home className="h-3.5 w-3.5" />
                </Link>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>{crumb}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
        <div className="flex items-center gap-1">
          <ThemeToggle />
          <Button type="button" variant="ghost" size="icon" className="h-9 w-9" aria-label="Display">
            <Monitor className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </header>
  );
}

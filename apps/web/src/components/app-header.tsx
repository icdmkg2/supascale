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
    <header className="shrink-0 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="flex flex-col gap-4 px-6 py-5 sm:flex-row sm:items-start sm:justify-between sm:px-8 sm:py-6">
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">{title}</h1>
          {subtitle ? (
            <p className="mt-1.5 max-w-3xl text-sm leading-relaxed text-muted-foreground">{subtitle}</p>
          ) : null}
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
        </div>
        <div className="flex shrink-0 items-center gap-1 self-start sm:self-center">
          <ThemeToggle />
          <Button type="button" variant="ghost" size="icon" className="h-9 w-9" aria-label="Display">
            <Monitor className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </header>
  );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  Cloud,
  DatabaseBackup,
  FolderKanban,
  Globe,
  LayoutDashboard,
  ListTodo,
  LogOut,
  ScrollText,
  Settings,
} from "lucide-react";
import { APP_NAME, APP_VERSION, NAV } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

const icons = {
  LayoutDashboard,
  FolderKanban,
  ListTodo,
  DatabaseBackup,
  Cloud,
  Globe,
  ScrollText,
  Activity,
  Settings,
} as const;

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-full w-[240px] shrink-0 flex-col border-r border-border bg-sidebar text-sidebar-foreground">
      <div className="border-b border-sidebar-border px-4 py-5">
        <div className="text-lg font-semibold tracking-tight text-foreground">{APP_NAME}</div>
        <div className="mt-1 text-xs text-primary">
          v{APP_VERSION} · {new Date().toLocaleDateString(undefined, { month: "short", day: "numeric" })}
        </div>
      </div>
      <ScrollArea className="flex-1 px-2 py-3">
        <nav className="flex flex-col gap-1">
          {NAV.map((item) => {
            const Icon = icons[item.icon];
            const active =
              item.href === "/"
                ? pathname === "/"
                : pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                  active
                    ? "border border-primary/60 bg-sidebar-accent text-primary"
                    : "text-muted-foreground hover:bg-sidebar-accent/80 hover:text-foreground",
                )}
              >
                <Icon className={cn("h-4 w-4 shrink-0", active && "text-primary")} />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </ScrollArea>
      <div className="border-t border-sidebar-border p-3">
        <form action="/api/auth/logout" method="POST">
          <Button
            type="submit"
            variant="ghost"
            className="w-full justify-start gap-2 text-muted-foreground hover:text-foreground"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </Button>
        </form>
      </div>
    </aside>
  );
}

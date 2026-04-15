export const APP_NAME = "SupaScale";
export const APP_VERSION = "1.0.0";

export const NAV = [
  { href: "/", label: "Dashboard", icon: "LayoutDashboard" as const },
  { href: "/projects", label: "Projects", icon: "FolderKanban" as const },
  { href: "/tasks", label: "Tasks", icon: "ListTodo" as const },
  { href: "/backups", label: "Backups", icon: "DatabaseBackup" as const },
  { href: "/cloud-storage", label: "Cloud Storage", icon: "Cloud" as const },
  { href: "/domains", label: "Domains", icon: "Globe" as const },
  { href: "/logs", label: "Logs", icon: "ScrollText" as const },
  { href: "/resources", label: "Resources", icon: "Activity" as const },
  { href: "/settings", label: "Settings", icon: "Settings" as const },
] as const;

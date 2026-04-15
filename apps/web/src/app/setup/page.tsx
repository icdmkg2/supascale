import { redirect } from "next/navigation";
import { countUsers } from "@/lib/auth/users";
import { SetupForm } from "./setup-form";

export default function SetupPage() {
  if (countUsers() > 0) {
    redirect("/login");
  }
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <div className="w-full max-w-md space-y-6 rounded-lg border border-border bg-card p-8 shadow-sm">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Create admin</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            First launch setup for SupaScale. Choose credentials for the administrator account.
          </p>
        </div>
        <SetupForm />
      </div>
    </div>
  );
}

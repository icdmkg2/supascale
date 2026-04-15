import { redirect } from "next/navigation";
import { countUsers } from "@/lib/auth/users";
import { getSession } from "@/lib/auth/session";
import { LoginForm } from "./login-form";

export default async function LoginPage() {
  if (countUsers() === 0) {
    redirect("/setup");
  }
  const session = await getSession();
  if (session) {
    redirect("/");
  }
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <div className="w-full max-w-md space-y-6 rounded-lg border border-border bg-card p-8 shadow-sm">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Sign in</h1>
          <p className="mt-2 text-sm text-muted-foreground">SupaScale control plane</p>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}

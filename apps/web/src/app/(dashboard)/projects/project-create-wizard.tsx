"use client";

import * as React from "react";
import {
  AlertTriangle,
  Check,
  Circle,
  Database,
  ImageIcon,
  LayoutDashboard,
  Layers,
  Loader2,
  Radio,
  Warehouse,
  Workflow,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

type WizardStep = "services" | "details" | "deploy";

export type ServiceKey = "rest" | "meta" | "studio" | "realtime" | "storage" | "imgproxy" | "functions" | "pooler";

const SERVICE_LABEL: Record<ServiceKey, string> = {
  rest: "REST API (PostgREST)",
  meta: "Metadata API",
  studio: "Studio Dashboard",
  realtime: "Realtime",
  storage: "Storage API",
  imgproxy: "Image Proxy",
  functions: "Edge Functions",
  pooler: "Connection Pooler",
};

type CoreDef = {
  id: ServiceKey;
  title: string;
  description: string;
  mb: number;
  icon: React.ComponentType<{ className?: string }>;
};

const CORE_SERVICES: CoreDef[] = [
  {
    id: "rest",
    title: "REST API (PostgREST)",
    description: "Auto-generated REST interface to your Postgres schema.",
    mb: 60,
    icon: Zap,
  },
  {
    id: "meta",
    title: "Metadata API",
    description: "Schema introspection for Studio and tooling.",
    mb: 40,
    icon: Database,
  },
  {
    id: "studio",
    title: "Studio Dashboard",
    description: "Web UI to manage tables, auth, and SQL.",
    mb: 150,
    icon: LayoutDashboard,
  },
];

type OptDef = CoreDef & { warn?: string };

const OPTIONAL_SERVICES: OptDef[] = [
  {
    id: "realtime",
    title: "Realtime",
    description: "Postgres changes broadcast over websockets.",
    mb: 100,
    icon: Radio,
  },
  {
    id: "storage",
    title: "Storage API",
    description: "S3-compatible object storage with RLS.",
    mb: 80,
    icon: Warehouse,
    warn: "Disabling will also turn off the image processing pipeline that depends on Storage.",
  },
  {
    id: "imgproxy",
    title: "Image Proxy",
    description: "On-the-fly image transforms for Storage.",
    mb: 100,
    icon: ImageIcon,
  },
  {
    id: "functions",
    title: "Edge Functions",
    description: "Deno functions at the edge of your project.",
    mb: 150,
    icon: Workflow,
  },
  {
    id: "pooler",
    title: "Connection Pooler",
    description: "Transaction-mode pooler (Supavisor) for high connection counts.",
    mb: 60,
    icon: Layers,
  },
];

const DEPLOY_STEPS = [
  { id: "validate", label: "Validating project configuration" },
  { id: "dir", label: "Creating project directory", detail: "Preparing workspace under PROJECTS_ROOT" },
  {
    id: "fetch",
    label: "Downloading Supabase Docker definitions",
    detail: "Fetching official compose files from GitHub — this may take a minute",
  },
  { id: "secrets", label: "Generating secure credentials" },
  { id: "env", label: "Configuring environment variables" },
  { id: "prefs", label: "Recording service preferences" },
  { id: "compose", label: "Starting Docker stack & Traefik labels" },
  { id: "finalize", label: "Finalizing project setup" },
] as const;

const STEP_FLOW: { id: WizardStep; label: string }[] = [
  { id: "services", label: "Services" },
  { id: "details", label: "Details" },
  { id: "deploy", label: "Deploy" },
];

function defaultSelection(): Record<ServiceKey, boolean> {
  return {
    rest: true,
    meta: true,
    studio: true,
    realtime: false,
    storage: true,
    imgproxy: true,
    functions: false,
    pooler: false,
  };
}

function selectionSummary(sel: Record<ServiceKey, boolean>): string {
  const on = (Object.keys(SERVICE_LABEL) as ServiceKey[]).filter((k) => sel[k]);
  return on.map((k) => SERVICE_LABEL[k]).join(", ");
}

export function ProjectCreateWizard({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: () => Promise<void>;
}) {
  const [step, setStep] = React.useState<WizardStep>("services");
  const [selection, setSelection] = React.useState<Record<ServiceKey, boolean>>(defaultSelection);

  const [name, setName] = React.useState("");
  const [slug, setSlug] = React.useState("");
  const [kongHost, setKongHost] = React.useState("api.example.com");
  const [studioHost, setStudioHost] = React.useState("");
  const [tls, setTls] = React.useState(false);

  const [deployPhase, setDeployPhase] = React.useState<"idle" | "running" | "success" | "error">("idle");
  const [activeDeployIndex, setActiveDeployIndex] = React.useState(0);
  const [deployError, setDeployError] = React.useState<string | null>(null);
  const [composeWarning, setComposeWarning] = React.useState<string | null>(null);
  const [formError, setFormError] = React.useState<string | null>(null);
  const [deployLabel, setDeployLabel] = React.useState("");

  const tickRef = React.useRef<ReturnType<typeof setInterval> | null>(null);

  const resetWizard = React.useCallback(() => {
    setStep("services");
    setSelection(defaultSelection());
    setName("");
    setSlug("");
    setKongHost("api.example.com");
    setStudioHost("");
    setTls(false);
    setDeployPhase("idle");
    setActiveDeployIndex(0);
    setDeployError(null);
    setComposeWarning(null);
    setFormError(null);
    setDeployLabel("");
    if (tickRef.current) {
      clearInterval(tickRef.current);
      tickRef.current = null;
    }
  }, []);

  React.useEffect(() => {
    return () => {
      if (tickRef.current) clearInterval(tickRef.current);
    };
  }, []);

  React.useEffect(() => {
    if (!open) {
      resetWizard();
    }
  }, [open, resetWizard]);

  function setService(key: ServiceKey, value: boolean) {
    setSelection((prev) => {
      const next = { ...prev, [key]: value };
      if (key === "storage" && !value) {
        next.imgproxy = false;
      }
      return next;
    });
  }

  function goDetails() {
    setFormError(null);
    setStep("details");
  }

  function goBackToServices() {
    setStep("services");
  }

  async function runDeploy() {
    setFormError(null);
    setDeployError(null);
    setComposeWarning(null);
    if (!name.trim() || !slug.trim() || !kongHost.trim()) {
      setFormError("Name, slug, and API hostname are required.");
      return;
    }

    setStep("deploy");
    setDeployPhase("running");
    setActiveDeployIndex(0);
    setDeployLabel(name.trim() || slug.trim() || "project");

    let idx = 0;
    tickRef.current = setInterval(() => {
      idx = Math.min(idx + 1, DEPLOY_STEPS.length - 2);
      setActiveDeployIndex(idx);
    }, 900);

    const servicePreferences = { ...selection };

    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          slug: slug.trim().toLowerCase(),
          kongHost: kongHost.trim(),
          studioHost: studioHost.trim() || null,
          tls,
          servicePreferences,
        }),
      });

      if (tickRef.current) {
        clearInterval(tickRef.current);
        tickRef.current = null;
      }

      if (!res.ok) {
        const j = (await res.json().catch(() => null)) as { error?: unknown };
        const msg = typeof j?.error === "string" ? j.error : "Create failed";
        setDeployPhase("error");
        setDeployError(msg);
        setActiveDeployIndex(Math.max(0, DEPLOY_STEPS.length - 3));
        return;
      }

      const created = (await res.json()) as { status: string; lastError?: string | null };
      setActiveDeployIndex(DEPLOY_STEPS.length - 1);
      setDeployPhase("success");

      if (created.status === "error") {
        const w =
          "Docker compose failed to start this stack. Open the stacks table below and expand “Last error” for the full log.";
        setComposeWarning(w);
      } else {
        setComposeWarning(null);
      }

      setName("");
      setSlug("");
      setSelection(defaultSelection());
      await onCreated();

      window.setTimeout(() => {
        setDeployPhase("idle");
        setActiveDeployIndex(0);
        onOpenChange(false);
      }, 2600);
    } catch (e) {
      if (tickRef.current) {
        clearInterval(tickRef.current);
        tickRef.current = null;
      }
      setDeployPhase("error");
      setDeployError(e instanceof Error ? e.message : "Request failed");
      setActiveDeployIndex(Math.max(0, DEPLOY_STEPS.length - 3));
    }
  }

  function deployStepState(i: number): "done" | "active" | "pending" | "error" {
    if (deployPhase === "error" && i === activeDeployIndex) return "error";
    if (deployPhase === "success") return "done";
    if (deployPhase === "running") {
      if (i < activeDeployIndex) return "done";
      if (i === activeDeployIndex) return "active";
      return "pending";
    }
    return "pending";
  }

  const blockingClose = deployPhase === "running";

  return (
    <Dialog
      open={open}
      onOpenChange={(next, eventDetails) => {
        if (!next && blockingClose) {
          eventDetails.preventUnmountOnClose();
          return;
        }
        onOpenChange(next);
      }}
    >
      <DialogContent
        showCloseButton={!blockingClose}
        className="gap-0 p-0 sm:max-w-3xl"
      >
        <DialogHeader className="shrink-0 space-y-1 border-b border-border px-6 py-4 pr-14">
          <DialogTitle>New project</DialogTitle>
          <DialogDescription className="sr-only">
            Choose services, enter project details, then deploy the Supabase Docker stack.
          </DialogDescription>
          <div className="flex flex-wrap gap-2 pt-2" aria-hidden>
            {STEP_FLOW.map((s, i) => {
              const active = step === s.id;
              return (
                <span
                  key={s.id}
                  className={cn(
                    "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors",
                    active
                      ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-300"
                      : "border-border/60 bg-muted/30 text-muted-foreground",
                  )}
                >
                  <span className="mr-1 tabular-nums opacity-80">{i + 1}</span>
                  {s.label}
                </span>
              );
            })}
          </div>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4">
          {step === "services" ? (
            <div className="space-y-6">
              <div className="space-y-2">
                <h3 className="text-base font-semibold tracking-tight">Only run what you need</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  Toggle optional Supabase services to match how you&apos;ll use this stack. Your choices are saved with
                  the project and shown in the deploy steps. The first run still uses Supabase&apos;s standard Docker
                  bundle; finer-grained omission is planned for a later release.
                </p>
              </div>

              <Card className="border-border/80 bg-muted/20">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Core services</CardTitle>
                  <CardDescription>Core APIs are always enabled for a working stack.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {CORE_SERVICES.map((s) => {
                    const Icon = s.icon;
                    const on = selection[s.id];
                    return (
                      <div
                        key={s.id}
                        className={cn(
                          "flex gap-3 rounded-xl border p-3 sm:p-4",
                          on ? "border-emerald-500/35 bg-emerald-500/[0.06]" : "border-border bg-card/50",
                        )}
                      >
                        <Icon className="mt-0.5 size-5 shrink-0 text-emerald-400/90" aria-hidden />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="text-sm font-medium">{s.title}</p>
                              <p className="mt-1 text-xs text-muted-foreground">{s.description}</p>
                            </div>
                            <span className="shrink-0 text-xs tabular-nums text-muted-foreground">{s.mb} MB</span>
                          </div>
                        </div>
                        <Switch
                          checked={on}
                          disabled
                          className="pointer-events-none shrink-0 opacity-90 data-[state=checked]:bg-emerald-600"
                          aria-label={`${s.title} (required)`}
                        />
                      </div>
                    );
                  })}
                </CardContent>
              </Card>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-amber-500/90">
                  <AlertTriangle className="size-3.5" aria-hidden />
                  Optional services
                </div>
                <Card className="border-border/80 bg-muted/15">
                  <CardContent className="space-y-3 pt-6">
                    {OPTIONAL_SERVICES.map((s) => {
                      const Icon = s.icon;
                      const on = selection[s.id];
                      const disabled = s.id === "imgproxy" && !selection.storage;
                      return (
                        <div
                          key={s.id}
                          className={cn(
                            "flex gap-3 rounded-xl border p-3 sm:p-4",
                            on && !disabled ? "border-emerald-500/35 bg-emerald-500/[0.06]" : "border-border bg-card/40",
                            disabled && "opacity-60",
                          )}
                        >
                          <Icon className="mt-0.5 size-5 shrink-0 text-emerald-400/80" aria-hidden />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <p className="text-sm font-medium">{s.title}</p>
                                <p className="mt-1 text-xs text-muted-foreground">{s.description}</p>
                                {s.warn ? <p className="mt-2 text-xs text-amber-500/85">{s.warn}</p> : null}
                                {s.id === "imgproxy" && !selection.storage ? (
                                  <p className="mt-2 text-xs text-muted-foreground">
                                    Enable Storage to use image transforms.
                                  </p>
                                ) : null}
                              </div>
                              <span className="shrink-0 text-xs tabular-nums text-muted-foreground">{s.mb} MB</span>
                            </div>
                          </div>
                          <Switch
                            checked={on && !disabled}
                            onCheckedChange={(v) => setService(s.id, v)}
                            disabled={disabled}
                            className="shrink-0 data-[state=checked]:bg-emerald-600"
                            aria-label={s.title}
                          />
                        </div>
                      );
                    })}
                  </CardContent>
                </Card>
              </div>

              <div className="flex justify-end border-t border-border/60 pt-4">
                <Button type="button" size="lg" onClick={goDetails}>
                  Continue
                </Button>
              </div>
            </div>
          ) : null}

          {step === "details" ? (
            <div className="space-y-6">
              <div className="space-y-2">
                <h3 className="text-base font-semibold tracking-tight">Name &amp; routing</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  Choose a display name and slug for the project directory, then set the hostnames Traefik should route
                  to Kong and optionally Studio.
                </p>
              </div>

              <Card className="border-border/80 bg-muted/20">
                <CardHeader>
                  <CardTitle className="text-base">Project details</CardTitle>
                  <CardDescription>These values are written into compose labels and environment files.</CardDescription>
                </CardHeader>
                <CardContent>
                  <form
                    className="space-y-4"
                    onSubmit={(e) => {
                      e.preventDefault();
                      void runDeploy();
                    }}
                  >
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="wiz-name">Name</Label>
                        <Input id="wiz-name" value={name} onChange={(e) => setName(e.target.value)} required />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="wiz-slug">Slug</Label>
                        <Input
                          id="wiz-slug"
                          value={slug}
                          onChange={(e) => setSlug(e.target.value.toLowerCase())}
                          placeholder="my-project"
                          required
                        />
                      </div>
                      <div className="space-y-2 sm:col-span-2">
                        <Label htmlFor="wiz-kong">Kong / API hostname</Label>
                        <Input id="wiz-kong" value={kongHost} onChange={(e) => setKongHost(e.target.value)} required />
                      </div>
                      <div className="space-y-2 sm:col-span-2">
                        <Label htmlFor="wiz-studio">Studio hostname (optional)</Label>
                        <Input
                          id="wiz-studio"
                          value={studioHost}
                          onChange={(e) => setStudioHost(e.target.value)}
                          placeholder="studio.example.com"
                        />
                      </div>
                      <div className="flex items-center gap-2 sm:col-span-2">
                        <Switch id="wiz-tls" checked={tls} onCheckedChange={setTls} />
                        <Label htmlFor="wiz-tls">Use TLS entrypoint + cert resolver (from Settings)</Label>
                      </div>
                    </div>
                    {formError ? (
                      <p className="text-sm text-destructive" role="alert">
                        {formError}
                      </p>
                    ) : null}
                    <div className="flex flex-wrap gap-2 border-t border-border/60 pt-4">
                      <Button type="button" variant="outline" onClick={goBackToServices}>
                        Back
                      </Button>
                      <Button type="submit">Deploy stack</Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </div>
          ) : null}

          {step === "deploy" ? (
            <div className="space-y-6">
              <div className="space-y-2">
                <h3 className="text-base font-semibold tracking-tight">Deploy in minutes</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  Watch your Supabase instance come online. SupaScale downloads the official compose files, injects
                  secrets and URLs, writes Traefik labels, and runs{" "}
                  <code className="rounded bg-muted px-1 py-0.5 text-xs">docker compose up</code> for you.
                </p>
              </div>

              <Card className="border-border/80 bg-muted/25">
                <CardHeader className="space-y-3 border-b border-border/60 pb-4">
                  <div className="flex items-start gap-3">
                    {deployPhase === "running" ? (
                      <Loader2 className="size-9 shrink-0 animate-spin text-emerald-400" aria-hidden />
                    ) : deployPhase === "success" ? (
                      <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-400">
                        <Check className="size-5" strokeWidth={2.5} aria-hidden />
                      </div>
                    ) : deployPhase === "error" ? (
                      <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-destructive/15 text-destructive">
                        <AlertTriangle className="size-5" aria-hidden />
                      </div>
                    ) : (
                      <Loader2 className="size-9 shrink-0 text-muted-foreground" aria-hidden />
                    )}
                    <div>
                      <CardTitle className="text-base">
                        {deployPhase === "success"
                          ? "Project created"
                          : deployPhase === "error"
                            ? "Deployment failed"
                            : `Creating ${deployLabel || "project"}…`}
                      </CardTitle>
                      <CardDescription>
                        {deployPhase === "success"
                          ? "Closing wizard…"
                          : deployPhase === "error"
                            ? "Fix the issue and try again from the previous step."
                            : "Setting up your new Supabase instance"}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-5">
                  <ul className="space-y-3 sm:space-y-4">
                    {DEPLOY_STEPS.map((s, i) => {
                      const st = deployStepState(i);
                      const detail =
                        s.id === "prefs"
                          ? selectionSummary(selection)
                          : "detail" in s
                            ? s.detail
                            : undefined;
                      return (
                        <li key={s.id} className="flex gap-3">
                          <div className="mt-0.5 shrink-0">
                            {st === "done" ? (
                              <div className="flex size-6 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
                                <Check className="size-3.5" strokeWidth={3} aria-hidden />
                              </div>
                            ) : st === "active" ? (
                              <Loader2 className="size-6 animate-spin text-emerald-400" aria-hidden />
                            ) : st === "error" ? (
                              <div className="flex size-6 items-center justify-center rounded-full bg-destructive/20 text-destructive">
                                <AlertTriangle className="size-3.5" aria-hidden />
                              </div>
                            ) : (
                              <Circle className="size-6 text-muted-foreground/35" strokeWidth={1.25} aria-hidden />
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-start justify-between gap-2">
                              <p
                                className={cn(
                                  "text-sm font-medium leading-snug",
                                  st === "pending" && "text-muted-foreground",
                                  st === "active" && "text-emerald-400",
                                  st === "error" && "text-destructive",
                                )}
                              >
                                {s.label}
                              </p>
                              {st === "active" && deployPhase === "running" ? (
                                <span className="text-xs font-medium text-emerald-400/90">In progress</span>
                              ) : null}
                            </div>
                            {detail ? (
                              <p className="mt-1 text-xs text-muted-foreground">{detail}</p>
                            ) : null}
                          </div>
                        </li>
                      );
                    })}
                  </ul>

                  {composeWarning && deployPhase === "success" ? (
                    <div
                      className="mt-6 rounded-lg border border-amber-500/40 bg-amber-500/5 p-3 text-sm text-amber-100/90"
                      role="status"
                    >
                      {composeWarning}
                    </div>
                  ) : null}

                  {deployError ? (
                    <div
                      className="mt-6 rounded-lg border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive"
                      role="alert"
                    >
                      {deployError}
                    </div>
                  ) : null}

                  {deployPhase === "error" ? (
                    <div className="mt-4 flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setStep("details");
                          setDeployPhase("idle");
                          setDeployError(null);
                          setComposeWarning(null);
                        }}
                      >
                        Back to details
                      </Button>
                    </div>
                  ) : null}
                </CardContent>
              </Card>
            </div>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}

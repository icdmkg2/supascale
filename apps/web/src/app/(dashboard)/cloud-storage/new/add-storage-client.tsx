"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Cloud,
  CloudCog,
  Database,
  Eye,
  EyeOff,
  HardDrive,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import type { CreateStorageInput } from "@/server/cloud-storage/create-schema";

type ProviderKind = "s3" | "gcs" | "azure" | "local";

const PROVIDER_CARDS: {
  id: ProviderKind;
  title: string;
  description: string;
  Icon: typeof Cloud;
}[] = [
  {
    id: "s3",
    title: "Amazon S3",
    description: "AWS S3 or S3 compatible storage (MinIO, R2, etc.).",
    Icon: Cloud,
  },
  {
    id: "gcs",
    title: "Google Cloud Storage",
    description: "Interoperable HMAC keys or S3-compatible XML API.",
    Icon: Database,
  },
  {
    id: "azure",
    title: "Azure Blob Storage",
    description: "Microsoft Azure storage accounts and containers.",
    Icon: CloudCog,
  },
  {
    id: "local",
    title: "Local Filesystem",
    description: "Host paths accessible to the panel worker.",
    Icon: HardDrive,
  },
];

export function AddStorageClient() {
  const router = useRouter();
  const [name, setName] = React.useState("");
  const [isDefault, setIsDefault] = React.useState(false);
  const [providerKind, setProviderKind] = React.useState<ProviderKind>("s3");
  const [endpoint, setEndpoint] = React.useState("https://s3.amazonaws.com");
  const [region, setRegion] = React.useState("us-east-1");
  const [bucket, setBucket] = React.useState("");
  const [accessKey, setAccessKey] = React.useState("");
  const [secretKey, setSecretKey] = React.useState("");
  const [showSecret, setShowSecret] = React.useState(false);
  const [useSsl, setUseSsl] = React.useState(true);
  const [pathPrefix, setPathPrefix] = React.useState("");
  const [accountName, setAccountName] = React.useState("");
  const [container, setContainer] = React.useState("");
  const [accountKey, setAccountKey] = React.useState("");
  const [localPath, setLocalPath] = React.useState("");
  const [label, setLabel] = React.useState("");
  const [saving, setSaving] = React.useState(false);
  const [testing, setTesting] = React.useState(false);
  const [testMessage, setTestMessage] = React.useState<string | null>(null);

  function buildPayload(): CreateStorageInput {
    const path = pathPrefix.trim() || null;
    const nm = name.trim() || "Storage";
    switch (providerKind) {
      case "s3":
        return {
          providerKind: "s3",
          name: nm,
          isDefault,
          pathPrefix: path,
          endpoint: endpoint.trim(),
          region: region.trim() || null,
          bucket: bucket.trim(),
          accessKey: accessKey.trim(),
          secretKey: secretKey.trim(),
          useSsl,
        };
      case "gcs":
        return {
          providerKind: "gcs",
          name: nm,
          isDefault,
          pathPrefix: path,
          endpoint: endpoint.trim() || null,
          region: region.trim() || null,
          bucket: bucket.trim(),
          accessKey: accessKey.trim(),
          secretKey: secretKey.trim(),
          useSsl,
        };
      case "azure":
        return {
          providerKind: "azure",
          name: nm,
          isDefault,
          pathPrefix: path,
          accountName: accountName.trim(),
          container: container.trim(),
          accountKey: accountKey.trim(),
        };
      case "local":
        return {
          providerKind: "local",
          name: nm,
          isDefault,
          pathPrefix: path,
          localPath: localPath.trim(),
          label: label.trim() || null,
        };
    }
  }

  async function runTest() {
    setTestMessage(null);
    setTesting(true);
    try {
      const res = await fetch("/api/cloud-storage/probe", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildPayload()),
      });
      const data = (await res.json()) as { ok?: boolean; message?: string; error?: unknown };
      if (res.ok && data.ok) {
        setTestMessage(data.message ?? "Looks good.");
      } else {
        setTestMessage("Check required fields and credentials.");
      }
    } finally {
      setTesting(false);
    }
  }

  async function submit() {
    setSaving(true);
    try {
      const res = await fetch("/api/cloud-storage", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildPayload()),
      });
      if (res.ok) {
        router.push("/cloud-storage");
        router.refresh();
        return;
      }
    } finally {
      setSaving(false);
    }
  }

  const canSubmit = (() => {
    if (!name.trim()) return false;
    switch (providerKind) {
      case "s3":
        return !!(endpoint.trim() && bucket.trim() && accessKey.trim() && secretKey.trim());
      case "gcs":
        return !!(bucket.trim() && accessKey.trim() && secretKey.trim());
      case "azure":
        return !!(accountName.trim() && container.trim() && accountKey.trim());
      case "local":
        return !!localPath.trim();
      default:
        return false;
    }
  })();

  return (
    <div className="space-y-8">
      <div>
        <Link
          href="/cloud-storage"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" aria-hidden />
          Back
        </Link>
      </div>

      <Card className="border-border bg-card">
        <CardHeader className="pb-4">
          <CardTitle className="text-base">Basic Information</CardTitle>
          <CardDescription>Give your storage provider a name</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="st-name">Provider Name</Label>
            <Input
              id="st-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Production Backups"
            />
          </div>
          <div className="flex flex-col gap-3 rounded-lg border border-border/80 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-medium">Set as Default</p>
              <p className="text-xs text-muted-foreground">Use this provider for backups by default.</p>
            </div>
            <Switch checked={isDefault} onCheckedChange={setIsDefault} aria-label="Set as default" />
          </div>
        </CardContent>
      </Card>

      <Card className="border-border bg-card">
        <CardHeader className="pb-4">
          <CardTitle className="text-base">Provider Type</CardTitle>
          <CardDescription>Select your storage provider</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2">
            {PROVIDER_CARDS.map((p) => {
              const selected = providerKind === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setProviderKind(p.id)}
                  className={cn(
                    "flex flex-col items-start gap-3 rounded-xl border p-4 text-left transition-colors",
                    selected
                      ? "border-primary bg-primary/5 shadow-[0_0_0_1px_hsl(var(--primary)/0.35)]"
                      : "border-border bg-background/50 hover:border-border hover:bg-muted/30",
                  )}
                >
                  <span
                    className={cn(
                      "flex size-10 items-center justify-center rounded-lg",
                      selected ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground",
                    )}
                  >
                    <p.Icon className="size-5" />
                  </span>
                  <div>
                    <p className="font-semibold text-foreground">{p.title}</p>
                    <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{p.description}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {(providerKind === "s3" || providerKind === "gcs") && (
        <Card className="border-border bg-card">
          <CardHeader className="pb-4">
            <CardTitle className="text-base">
              {providerKind === "s3" ? "S3 Configuration" : "Google Cloud Storage"}
            </CardTitle>
            <CardDescription>
              {providerKind === "s3"
                ? "Configure your Amazon S3 settings"
                : "Configure bucket and HMAC credentials"}
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="endpoint">Endpoint</Label>
              <Input
                id="endpoint"
                value={endpoint}
                onChange={(e) => setEndpoint(e.target.value)}
                placeholder={providerKind === "s3" ? "https://s3.amazonaws.com" : "https://storage.googleapis.com"}
                className="font-mono text-sm"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="region">Region</Label>
              <Input
                id="region"
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                placeholder="us-east-1"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bucket">Bucket Name</Label>
              <Input
                id="bucket"
                value={bucket}
                onChange={(e) => setBucket(e.target.value)}
                placeholder="my-backup-bucket"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ak">Access Key ID</Label>
              <Input
                id="ak"
                value={accessKey}
                onChange={(e) => setAccessKey(e.target.value)}
                autoComplete="off"
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="sk">Secret Access Key</Label>
              <div className="relative">
                <Input
                  id="sk"
                  type={showSecret ? "text" : "password"}
                  value={secretKey}
                  onChange={(e) => setSecretKey(e.target.value)}
                  autoComplete="new-password"
                  className="pr-10"
                />
                <button
                  type="button"
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  onClick={() => setShowSecret(!showSecret)}
                  aria-label={showSecret ? "Hide secret" : "Show secret"}
                >
                  {showSecret ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>
            <div className="flex items-center gap-2 md:col-span-2">
              <Switch id="ssl" checked={useSsl} onCheckedChange={setUseSsl} />
              <Label htmlFor="ssl">Use SSL</Label>
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="prefix">Path Prefix (optional)</Label>
              <Input
                id="prefix"
                value={pathPrefix}
                onChange={(e) => setPathPrefix(e.target.value)}
                placeholder="/backups"
              />
              <p className="text-xs text-muted-foreground">
                Optional prefix for all objects stored in this bucket.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {providerKind === "azure" && (
        <Card className="border-border bg-card">
          <CardHeader className="pb-4">
            <CardTitle className="text-base">Azure Blob Storage</CardTitle>
            <CardDescription>Storage account and container</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="acct">Storage account name</Label>
              <Input
                id="acct"
                value={accountName}
                onChange={(e) => setAccountName(e.target.value)}
                placeholder="mystorageaccount"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cont">Container</Label>
              <Input
                id="cont"
                value={container}
                onChange={(e) => setContainer(e.target.value)}
                placeholder="backups"
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="akey">Account key</Label>
              <Input
                id="akey"
                type="password"
                value={accountKey}
                onChange={(e) => setAccountKey(e.target.value)}
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="az-prefix">Path Prefix (optional)</Label>
              <Input
                id="az-prefix"
                value={pathPrefix}
                onChange={(e) => setPathPrefix(e.target.value)}
                placeholder="/backups"
              />
            </div>
          </CardContent>
        </Card>
      )}

      {providerKind === "local" && (
        <Card className="border-border bg-card">
          <CardHeader className="pb-4">
            <CardTitle className="text-base">Local filesystem</CardTitle>
            <CardDescription>Directory on the host visible to the worker</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="lp">Path</Label>
              <Input
                id="lp"
                value={localPath}
                onChange={(e) => setLocalPath(e.target.value)}
                placeholder="/var/lib/supascale/backups"
                className="font-mono text-sm"
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="lbl">Volume label (optional)</Label>
              <Input
                id="lbl"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="default"
              />
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="border-border bg-card">
        <CardHeader className="pb-4">
          <CardTitle className="text-base">Test Connection</CardTitle>
          <CardDescription>Verify your settings are correct before saving</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <Button
            type="button"
            variant="outline"
            className="border-primary text-primary hover:bg-primary/10"
            disabled={testing || !canSubmit}
            onClick={() => void runTest()}
          >
            {testing ? "Testing…" : "Test Connection"}
          </Button>
          {testMessage ? <p className="text-sm text-muted-foreground">{testMessage}</p> : null}
        </CardContent>
      </Card>

      <div className="flex justify-end border-t border-border pt-6">
        <Button
          type="button"
          size="lg"
          className="min-w-[180px]"
          disabled={!canSubmit || saving}
          onClick={() => void submit()}
        >
          {saving ? "Saving…" : "Save provider"}
        </Button>
      </div>
    </div>
  );
}

"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type Row = {
  id: string;
  name: string;
  endpoint: string;
  region: string | null;
  bucket: string;
  useSsl: boolean;
};

export function StorageClient() {
  const [rows, setRows] = React.useState<Row[]>([]);
  const [name, setName] = React.useState("");
  const [endpoint, setEndpoint] = React.useState("");
  const [region, setRegion] = React.useState("");
  const [bucket, setBucket] = React.useState("");
  const [accessKey, setAccessKey] = React.useState("");
  const [secretKey, setSecretKey] = React.useState("");
  const [useSsl, setUseSsl] = React.useState(true);

  async function refresh() {
    const res = await fetch("/api/cloud-storage", { credentials: "include" });
    if (!res.ok) return;
    setRows(((await res.json()) as { storages: Row[] }).storages);
  }

  React.useEffect(() => {
    void refresh();
  }, []);

  async function save() {
    await fetch("/api/cloud-storage", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        endpoint,
        region: region || null,
        bucket,
        accessKey,
        secretKey,
        useSsl,
      }),
    });
    setAccessKey("");
    setSecretKey("");
    await refresh();
  }

  return (
    <div className="space-y-6">
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle>Add destination</CardTitle>
          <CardDescription>Keys are encrypted at rest using SESSION_SECRET-derived material.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="n">Name</Label>
            <Input id="n" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="e">Endpoint</Label>
            <Input id="e" value={endpoint} onChange={(e) => setEndpoint(e.target.value)} placeholder="https://s3.amazonaws.com" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="r">Region</Label>
            <Input id="r" value={region} onChange={(e) => setRegion(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="b">Bucket</Label>
            <Input id="b" value={bucket} onChange={(e) => setBucket(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ak">Access key</Label>
            <Input id="ak" value={accessKey} onChange={(e) => setAccessKey(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="sk">Secret key</Label>
            <Input id="sk" type="password" value={secretKey} onChange={(e) => setSecretKey(e.target.value)} />
          </div>
          <div className="flex items-center gap-2 md:col-span-2">
            <Switch id="ssl" checked={useSsl} onCheckedChange={setUseSsl} />
            <Label htmlFor="ssl">Use SSL</Label>
          </div>
          <div className="md:col-span-2">
            <Button type="button" onClick={() => void save()}>
              Save
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle>Destinations</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Endpoint</TableHead>
                <TableHead>Bucket</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium">{r.name}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{r.endpoint}</TableCell>
                  <TableCell className="font-mono text-xs">{r.bucket}</TableCell>
                </TableRow>
              ))}
              {rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center text-muted-foreground">
                    No destinations yet.
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

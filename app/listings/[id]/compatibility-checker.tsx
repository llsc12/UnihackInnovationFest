"use client";

// STREAM 2 owns this client component.
// TODO(stream-2): replace make/model/year inputs with cascading <Select>s populated from /api/vehicles.

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { CompatibilityResultPanel } from "@/components/compatibility-result";
import type { CompatibilityResult } from "@/lib/types";

export function CompatibilityChecker({ listingId }: { listingId: string }) {
  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [year, setYear] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CompatibilityResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/compatibility", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          listingId,
          vehicle: { make, model, year: Number(year) },
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      setResult((await res.json()) as CompatibilityResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Will it fit my car?</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={onSubmit} className="grid grid-cols-1 gap-3 sm:grid-cols-4">
          <div className="space-y-1.5">
            <Label htmlFor="make">Make</Label>
            <Input id="make" value={make} onChange={(e) => setMake(e.target.value)} placeholder="Volkswagen" required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="model">Model</Label>
            <Input id="model" value={model} onChange={(e) => setModel(e.target.value)} placeholder="Golf" required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="year">Year</Label>
            <Input id="year" type="number" value={year} onChange={(e) => setYear(e.target.value)} placeholder="2016" required />
          </div>
          <div className="flex items-end">
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? "Checking…" : "Check fit"}
            </Button>
          </div>
        </form>
        {error && <p className="text-sm text-destructive">{error}</p>}
        {result && <CompatibilityResultPanel result={result} />}
      </CardContent>
    </Card>
  );
}

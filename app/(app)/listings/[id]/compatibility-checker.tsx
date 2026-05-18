"use client";

// STREAM 2 owns this client component.

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { CompatibilityResultPanel } from "@/components/compatibility-result";
import type { CompatibilityResult, Vehicle } from "@/lib/types";

interface Props {
  listingId: string;
  vehicles: Vehicle[];
}

const SELECT_CLS =
  "flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50";

export function CompatibilityChecker({ listingId, vehicles }: Props) {
  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [year, setYear] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CompatibilityResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Derive cascading options from the vehicle catalogue
  const makes = useMemo(
    () => [...new Set(vehicles.map((v) => v.make))].sort(),
    [vehicles]
  );

  const models = useMemo(
    () =>
      make
        ? [...new Set(vehicles.filter((v) => v.make === make).map((v) => v.model))].sort()
        : [],
    [vehicles, make]
  );

  const years = useMemo(
    () =>
      make && model
        ? [
            ...new Set(
              vehicles
                .filter((v) => v.make === make && v.model === model)
                .map((v) => v.year)
            ),
          ].sort((a, b) => b - a) // newest first
        : [],
    [vehicles, make, model]
  );

  function onMakeChange(value: string) {
    setMake(value);
    setModel("");
    setYear("");
    setResult(null);
  }

  function onModelChange(value: string) {
    setModel(value);
    setYear("");
    setResult(null);
  }

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
            <select
              id="make"
              value={make}
              onChange={(e) => onMakeChange(e.target.value)}
              required
              className={SELECT_CLS}
            >
              <option value="">Select make…</option>
              {makes.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="model">Model</Label>
            <select
              id="model"
              value={model}
              onChange={(e) => onModelChange(e.target.value)}
              required
              disabled={!make}
              className={SELECT_CLS}
            >
              <option value="">Select model…</option>
              {models.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="year">Year</Label>
            <select
              id="year"
              value={year}
              onChange={(e) => { setYear(e.target.value); setResult(null); }}
              required
              disabled={!model}
              className={SELECT_CLS}
            >
              <option value="">Select year…</option>
              {years.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>

          <div className="flex items-end">
            <Button type="submit" disabled={loading || !make || !model || !year} className="w-full">
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

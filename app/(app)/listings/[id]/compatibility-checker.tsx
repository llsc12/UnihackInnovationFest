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
  const [vin, setVin] = useState("");
  const [vinLoading, setVinLoading] = useState(false);
  const [vinDecoded, setVinDecoded] = useState<{ make: string; model: string; year: number } | null>(null);
  const [vinError, setVinError] = useState<string | null>(null);
  const [vinWarning, setVinWarning] = useState<string | null>(null);

  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [year, setYear] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CompatibilityResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Cascading options derived from the vehicle catalogue
  const makes = useMemo(() => [...new Set(vehicles.map((v) => v.make))].sort(), [vehicles]);
  const models = useMemo(
    () => make ? [...new Set(vehicles.filter((v) => v.make === make).map((v) => v.model))].sort() : [],
    [vehicles, make]
  );
  const years = useMemo(
    () =>
      make && model
        ? [...new Set(vehicles.filter((v) => v.make === make && v.model === model).map((v) => v.year))].sort((a, b) => b - a)
        : [],
    [vehicles, make, model]
  );

  function onMakeChange(value: string) {
    setMake(value); setModel(""); setYear(""); setResult(null);
  }
  function onModelChange(value: string) {
    setModel(value); setYear(""); setResult(null);
  }

  // Case-insensitive catalogue match helpers
  function findMake(raw: string) {
    return makes.find((m) => m.toLowerCase() === raw.toLowerCase()) ?? null;
  }
  function findModel(catalogueMake: string, raw: string) {
    const opts = [...new Set(vehicles.filter((v) => v.make === catalogueMake).map((v) => v.model))];
    return opts.find((m) => m.toLowerCase() === raw.toLowerCase()) ?? null;
  }
  function findYear(catalogueMake: string, catalogueModel: string, y: number) {
    return vehicles.some((v) => v.make === catalogueMake && v.model === catalogueModel && v.year === y);
  }

  async function decodeVin() {
    const trimmed = vin.trim().toUpperCase();
    if (!trimmed) return;
    setVinLoading(true);
    setVinError(null);
    setVinWarning(null);
    setVinDecoded(null);

    try {
      const res = await fetch(`/api/vin?vin=${encodeURIComponent(trimmed)}`);
      const data = await res.json() as { make?: string; model?: string; year?: number; error?: string };
      if (!res.ok || data.error) {
        setVinError(data.error ?? "Could not decode VIN");
        return;
      }

      const { make: decodedMake, model: decodedModel, year: decodedYear } = data as { make: string; model: string; year: number };
      setVinDecoded({ make: decodedMake, model: decodedModel, year: decodedYear });

      // Try to auto-fill the dropdowns from the catalogue
      const catMake = findMake(decodedMake);
      if (!catMake) {
        setVinWarning(`Decoded: ${decodedYear} ${decodedMake} ${decodedModel} — not in our vehicle catalogue. Select manually below.`);
        return;
      }

      const catModel = findModel(catMake, decodedModel);
      if (!catModel) {
        setMake(catMake); setModel(""); setYear("");
        setVinWarning(`Decoded make matched (${catMake}) but model "${decodedModel}" is not in our catalogue. Select model manually.`);
        return;
      }

      const yearInCat = findYear(catMake, catModel, decodedYear);
      setMake(catMake);
      setModel(catModel);
      setYear(yearInCat ? String(decodedYear) : "");
      setResult(null);

      if (!yearInCat) {
        setVinWarning(`Decoded ${decodedYear} ${catMake} ${catModel} — year not in catalogue. Select closest year below.`);
      }
    } catch {
      setVinError("VIN decode failed — check your connection and try again.");
    } finally {
      setVinLoading(false);
    }
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
        body: JSON.stringify({ listingId, vehicle: { make, model, year: Number(year) } }),
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

        {/* VIN decode row */}
        <div className="space-y-1.5">
          <Label htmlFor="vin">VIN (auto-fill from chassis number)</Label>
          <div className="flex gap-2">
            <input
              id="vin"
              value={vin}
              onChange={(e) => { setVin(e.target.value.toUpperCase()); setVinDecoded(null); setVinError(null); setVinWarning(null); }}
              placeholder="e.g. WVWZZZ3CZHE123456"
              maxLength={17}
              className="flex h-9 flex-1 rounded-md border border-input bg-transparent px-3 font-mono text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={decodeVin}
              disabled={vinLoading || vin.trim().length !== 17}
            >
              {vinLoading ? "Decoding…" : "Decode VIN"}
            </Button>
          </div>
          {vinDecoded && !vinError && !vinWarning && (
            <p className="text-xs text-emerald-600">
              ✓ {vinDecoded.year} {vinDecoded.make} {vinDecoded.model} — dropdowns filled automatically
            </p>
          )}
          {vinWarning && <p className="text-xs text-amber-600">⚠ {vinWarning}</p>}
          {vinError && <p className="text-xs text-destructive">{vinError}</p>}
        </div>

        <div className="relative flex items-center gap-3 text-xs text-muted-foreground">
          <div className="flex-1 border-t" />
          <span>or select manually</span>
          <div className="flex-1 border-t" />
        </div>

        {/* Cascading dropdowns */}
        <form onSubmit={onSubmit} className="grid grid-cols-1 gap-3 sm:grid-cols-4">
          <div className="space-y-1.5">
            <Label htmlFor="make">Make</Label>
            <select id="make" value={make} onChange={(e) => onMakeChange(e.target.value)} required className={SELECT_CLS}>
              <option value="">Select make…</option>
              {makes.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="model">Model</Label>
            <select id="model" value={model} onChange={(e) => onModelChange(e.target.value)} required disabled={!make} className={SELECT_CLS}>
              <option value="">Select model…</option>
              {models.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="year">Year</Label>
            <select id="year" value={year} onChange={(e) => { setYear(e.target.value); setResult(null); }} required disabled={!model} className={SELECT_CLS}>
              <option value="">Select year…</option>
              {years.map((y) => <option key={y} value={y}>{y}</option>)}
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

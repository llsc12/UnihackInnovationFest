"use client";

// STREAM 1 owns this client component.
// TODO(stream-1):
//   - Validation (zod?) before submit.
//   - Image upload (or a URL list for now).
//   - Persist the generated listing somewhere (Stream 5 to provide data layer).
//   - Streaming response while Claude writes the listing.

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import type { GeneratedListing, ListingInput } from "@/lib/types";

const EMPTY: ListingInput = {
  partType: "",
  make: "",
  model: "",
  yearFrom: 2015,
  yearTo: 2020,
  condition: "good",
  partNumber: "",
  notes: "",
  price: undefined,
};

export function SellForm() {
  const [input, setInput] = useState<ListingInput>(EMPTY);
  const [loading, setLoading] = useState(false);
  const [generated, setGenerated] = useState<GeneratedListing | null>(null);
  const [streamingText, setStreamingText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [analysing, setAnalysing] = useState(false);

  function set<K extends keyof ListingInput>(key: K, value: ListingInput[K]) {
    setInput((prev) => ({ ...prev, [key]: value }));
  }

  async function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (!files.length) return;

    const slots = 4 - (input.images?.length ?? 0);
    const toUpload = files.slice(0, slots);

    setUploading(true);
    setError(null);
    try {
      const fd = new FormData();
      toUpload.forEach((f) => fd.append("images", f));
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      if (!res.ok) throw new Error((await res.json()).error ?? await res.text());
      const { urls } = await res.json() as { urls: string[] };
      set("images", [...(input.images ?? []), ...urls]);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setUploading(false);
    }
  }

  function removeImage(index: number) {
    set("images", (input.images ?? []).filter((_, i) => i !== index));
  }

  async function handleAnalyse() {
    const url = input.images?.[0];
    if (!url) return;
    setAnalysing(true);
    setError(null);
    try {
      const res = await fetch("/api/analyse-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? await res.text());
      const data = await res.json() as {
        partType?: string;
        condition?: ListingInput["condition"];
        partNumber?: string | null;
        notes?: string;
      };
      if (data.partType) set("partType", data.partType);
      if (data.condition) set("condition", data.condition);
      if (data.partNumber) set("partNumber", data.partNumber);
      if (data.notes) set("notes", data.notes);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setAnalysing(false);
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setGenerated(null);
    setStreamingText("");
    try {
      const res = await fetch("/api/generate-listing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      if (!res.ok || !res.body) throw new Error(await res.text());

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        setStreamingText(buffer);
      }
      buffer += decoder.decode();

      setGenerated(JSON.parse(buffer) as GeneratedListing);
      setStreamingText("");
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Part details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Part type" required>
              <Input value={input.partType} onChange={(e) => set("partType", e.target.value)} placeholder="Headlight" required />
            </Field>
            <Field label="Condition" required>
              <select
                value={input.condition}
                onChange={(e) => set("condition", e.target.value as ListingInput["condition"])}
                className="flex h-9 w-full rounded-md border bg-transparent px-3 text-sm"
              >
                <option value="new">New</option>
                <option value="like-new">Like new</option>
                <option value="good">Good</option>
                <option value="fair">Fair</option>
                <option value="for-parts">For parts</option>
              </select>
            </Field>
            <Field label="Make" required>
              <Input value={input.make} onChange={(e) => set("make", e.target.value)} placeholder="Volkswagen" required />
            </Field>
            <Field label="Model" required>
              <Input value={input.model} onChange={(e) => set("model", e.target.value)} placeholder="Golf" required />
            </Field>
            <Field label="Year from" required>
              <Input type="number" value={input.yearFrom} onChange={(e) => set("yearFrom", Number(e.target.value))} required />
            </Field>
            <Field label="Year to" required>
              <Input type="number" value={input.yearTo} onChange={(e) => set("yearTo", Number(e.target.value))} required />
            </Field>
            <Field label="Part number">
              <Input value={input.partNumber ?? ""} onChange={(e) => set("partNumber", e.target.value)} placeholder="5G1941005" />
            </Field>
            <Field label="Price (GBP)">
              <Input
                type="number"
                value={input.price ?? ""}
                onChange={(e) => set("price", e.target.value ? Number(e.target.value) : undefined)}
                placeholder="85"
              />
            </Field>
            <div className="sm:col-span-2">
              <Field label="Notes for buyers">
                <Textarea
                  rows={3}
                  value={input.notes ?? ""}
                  onChange={(e) => set("notes", e.target.value)}
                  placeholder="Minor scratches on lens, otherwise fully working."
                />
              </Field>
            </div>
            <div className="sm:col-span-2 space-y-3">
              <Label>Photos (up to 4)</Label>
              <div className="flex flex-wrap gap-3">
                {(input.images ?? []).map((url, i) => (
                  <div key={url} className="relative h-24 w-24 shrink-0">
                    <img
                      src={url}
                      alt={`Part photo ${i + 1}`}
                      className="h-full w-full rounded-md border object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(i)}
                      className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-[11px] text-destructive-foreground shadow"
                    >
                      ×
                    </button>
                  </div>
                ))}
                {(input.images?.length ?? 0) < 4 && (
                  <label className="flex h-24 w-24 shrink-0 cursor-pointer flex-col items-center justify-center gap-1 rounded-md border-2 border-dashed text-xs text-muted-foreground transition-colors hover:border-primary hover:text-primary">
                    {uploading ? "Uploading…" : (
                      <>
                        <span className="text-2xl leading-none">+</span>
                        <span>Add photo</span>
                      </>
                    )}
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      multiple
                      className="sr-only"
                      onChange={handleImageSelect}
                      disabled={uploading}
                    />
                  </label>
                )}
              </div>
              {(input.images?.length ?? 0) > 0 && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAnalyse}
                  disabled={analysing}
                >
                  {analysing ? "Analysing photo…" : "Pre-fill form from photo"}
                </Button>
              )}
            </div>

            <div className="sm:col-span-2">
              <Button type="submit" disabled={loading}>
                {loading ? "Generating…" : "Generate listing"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {streamingText && !generated && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
              </span>
              Generating…
            </CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="whitespace-pre-wrap break-words font-mono text-xs text-muted-foreground">
              {streamingText}
            </pre>
          </CardContent>
        </Card>
      )}

      {generated && (
        <Card>
          <CardHeader>
            <CardTitle>Generated listing</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <h2 className="text-lg font-semibold">{generated.title}</h2>
            <p>{generated.description}</p>
            <p className="text-muted-foreground"><b>Condition:</b> {generated.conditionNotes}</p>
            <p className="text-muted-foreground"><b>Fits:</b> {generated.compatibilitySummary}</p>
            <p className="text-muted-foreground"><b>Keywords:</b> {generated.keywords.join(", ")}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label>
        {label}
        {required && <span className="text-destructive"> *</span>}
      </Label>
      {children}
    </div>
  );
}

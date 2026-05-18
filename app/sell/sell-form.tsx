"use client";

// STREAM 1 owns this client component.
// TODO(stream-1):
//   - Validation (zod?) before submit.
//   - Image upload (or a URL list for now).
//   - Persist the generated listing somewhere (Stream 5 to provide data layer).

import { useState } from "react";
import { FileText, Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { ListingInput } from "@/lib/types";
import {
  finalizeListing,
  parseListingSections,
  type PartialListing,
} from "@/lib/listing-format";
import { cn } from "@/lib/utils";

type Mode = "template" | "ai";

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
  const [activeMode, setActiveMode] = useState<Mode | null>(null);
  const [partial, setPartial] = useState<PartialListing | null>(null);
  const [generatedBy, setGeneratedBy] = useState<Mode | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [analysing, setAnalysing] = useState(false);
  const [posting, setPosting] = useState(false);
  const [postedId, setPostedId] = useState<string | null>(null);

  const loading = activeMode !== null;

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

  async function onGenerate(mode: Mode) {
    if (!input.partType || !input.make || !input.model) {
      setError("Part type, make, and model are required.");
      return;
    }
    setActiveMode(mode);
    setError(null);
    setPartial(null);
    setGeneratedBy(null);
    setPostedId(null);
    try {
      const res = await fetch(`/api/generate-listing?mode=${mode}`, {
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
        setPartial(parseListingSections(buffer));
      }
      buffer += decoder.decode();
      setPartial(parseListingSections(buffer));
      setGeneratedBy(mode);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setActiveMode(null);
    }
  }

  const final = !loading && partial ? finalizeListing(partial) : null;

  async function onPost() {
    if (!final) return;
    setPosting(true);
    setError(null);
    try {
      const res = await fetch("/api/listings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input, generated: final }),
      });
      if (!res.ok) throw new Error(await res.text());
      const listing = await res.json();
      setPostedId(listing.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setPosting(false);
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Part details</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              onGenerate("ai");
            }}
            className="grid grid-cols-1 gap-4 sm:grid-cols-2"
          >
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

            <div className="sm:col-span-2 flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onGenerate("template")}
                disabled={loading}
              >
                <FileText className="h-4 w-4" />
                {activeMode === "template" ? "Generating…" : "Use template"}
              </Button>
              <Button type="submit" disabled={loading}>
                <Sparkles className="h-4 w-4" />
                {activeMode === "ai" ? "Generating…" : "Generate with Claude"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {(loading || partial) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex flex-wrap items-center gap-2">
              {loading && (
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                </span>
              )}
              <span>{loading ? "Generating listing…" : "Generated listing"}</span>
              {generatedBy && (
                <Badge variant={generatedBy === "ai" ? "default" : "secondary"} className="ml-auto">
                  {generatedBy === "ai" ? (
                    <><Sparkles className="mr-1 h-3 w-3" /> Claude</>
                  ) : (
                    <><FileText className="mr-1 h-3 w-3" /> Template</>
                  )}
                </Badge>
              )}
              {activeMode && (
                <Badge variant="outline" className="ml-auto">
                  {activeMode === "ai" ? (
                    <><Sparkles className="mr-1 h-3 w-3" /> Claude</>
                  ) : (
                    <><FileText className="mr-1 h-3 w-3" /> Template</>
                  )}
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <StreamLine
              value={partial?.title}
              isActive={loading && partial?.activeField === "title"}
              placeholder="Title…"
              className="text-xl font-semibold leading-tight"
            />
            <StreamLine
              value={partial?.description}
              isActive={loading && partial?.activeField === "description"}
              placeholder="Description…"
              className="text-sm leading-relaxed"
            />
            <div className="grid gap-3 sm:grid-cols-2 pt-2">
              <LabelledRow label="Condition">
                <StreamLine
                  value={partial?.conditionNotes}
                  isActive={loading && partial?.activeField === "conditionNotes"}
                  placeholder="…"
                  className="text-sm text-muted-foreground"
                />
              </LabelledRow>
              <LabelledRow label="Fits">
                <StreamLine
                  value={partial?.compatibilitySummary}
                  isActive={loading && partial?.activeField === "compatibilitySummary"}
                  placeholder="…"
                  className="text-sm text-muted-foreground"
                />
              </LabelledRow>
            </div>
            <LabelledRow label="Keywords">
              {final ? (
                <div className="flex flex-wrap gap-1.5">
                  {final.keywords.map((k) => (
                    <Badge key={k} variant="secondary">{k}</Badge>
                  ))}
                </div>
              ) : (
                <StreamLine
                  value={partial?.keywordsRaw}
                  isActive={loading && partial?.activeField === "keywordsRaw"}
                  placeholder="…"
                  className="text-sm text-muted-foreground"
                />
              )}
            </LabelledRow>
            {final && (
              <div className="pt-2">
                {postedId ? (
                  <p className="text-sm text-green-600">
                    Listing posted!{" "}
                    <a href={`/listings/${postedId}`} className="underline">View listing</a>
                  </p>
                ) : (
                  <Button onClick={onPost} disabled={posting}>
                    {posting ? "Posting…" : "Post listing"}
                  </Button>
                )}
              </div>
            )}
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

function LabelledRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </div>
      {children}
    </div>
  );
}

// Renders a streamed line. Shows a faint placeholder until any text arrives,
// and a blinking caret on the field currently being written.
function StreamLine({
  value,
  isActive,
  placeholder,
  className,
}: {
  value: string | undefined;
  isActive: boolean;
  placeholder: string;
  className?: string;
}) {
  const hasValue = !!value;
  return (
    <p className={cn(className, !hasValue && !isActive && "italic text-muted-foreground/50")}>
      {hasValue ? value : isActive ? "" : placeholder}
      {isActive && (
        <span className="ml-0.5 inline-block h-[1em] w-[2px] translate-y-0.5 animate-pulse bg-foreground/70 align-middle" />
      )}
    </p>
  );
}

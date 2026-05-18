"use client";

// STREAM 1 owns this client component.
// TODO(stream-1):
//   - Validation (zod?) before submit.
//   - Image upload (or a URL list for now).
//   - Persist the generated listing somewhere (Stream 5 to provide data layer).

import { useState } from "react";
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
  const [partial, setPartial] = useState<PartialListing | null>(null);
  const [error, setError] = useState<string | null>(null);

  function set<K extends keyof ListingInput>(key: K, value: ListingInput[K]) {
    setInput((prev) => ({ ...prev, [key]: value }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setPartial(null);
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
        setPartial(parseListingSections(buffer));
      }
      buffer += decoder.decode();
      setPartial(parseListingSections(buffer));
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  const final = !loading && partial ? finalizeListing(partial) : null;

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
            <div className="sm:col-span-2">
              <Button type="submit" disabled={loading}>
                {loading ? "Generating…" : "Generate listing"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {(loading || partial) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {loading && (
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                </span>
              )}
              {loading ? "Generating listing…" : "Generated listing"}
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

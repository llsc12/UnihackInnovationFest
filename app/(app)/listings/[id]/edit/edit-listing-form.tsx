"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import type { Listing, ListingInput, PartOrigin } from "@/lib/types";

export function EditListingForm({ listing }: { listing: Listing }) {
  const router = useRouter();
  const [input, setInput] = useState<ListingInput>(listing.input);
  const [title, setTitle] = useState(listing.generated.title);
  const [description, setDescription] = useState(listing.generated.description);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function set<K extends keyof ListingInput>(key: K, value: ListingInput[K]) {
    setInput((prev) => ({ ...prev, [key]: value }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/listings/${listing.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...input, title, description }),
      });
      if (!res.ok) throw new Error(await res.text());
      router.push(`/listings/${listing.id}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Part details</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Title" className="sm:col-span-2">
            <Input value={title} onChange={(e) => setTitle(e.target.value)} required />
          </Field>
          <Field label="Part type" required>
            <Input value={input.partType} onChange={(e) => set("partType", e.target.value)} required />
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
            <Input value={input.make} onChange={(e) => set("make", e.target.value)} required />
          </Field>
          <Field label="Model" required>
            <Input value={input.model} onChange={(e) => set("model", e.target.value)} required />
          </Field>
          <Field label="Year from" required>
            <Input type="number" value={input.yearFrom} onChange={(e) => set("yearFrom", Number(e.target.value))} required />
          </Field>
          <Field label="Year to" required>
            <Input type="number" value={input.yearTo} onChange={(e) => set("yearTo", Number(e.target.value))} required />
          </Field>
          <Field label="Part number">
            <Input value={input.partNumber ?? ""} onChange={(e) => set("partNumber", e.target.value)} />
          </Field>
          <Field label="Price (GBP)">
            <Input
              type="number"
              value={input.price ?? ""}
              onChange={(e) => set("price", e.target.value ? Number(e.target.value) : undefined)}
            />
          </Field>
          <div className="sm:col-span-2">
            <Field label="Description">
              <Textarea rows={4} value={description} onChange={(e) => setDescription(e.target.value)} />
            </Field>
          </div>
          <div className="sm:col-span-2">
            <Field label="Notes for buyers">
              <Textarea
                rows={2}
                value={input.notes ?? ""}
                onChange={(e) => set("notes", e.target.value)}
              />
            </Field>
          </div>
          <Field label="Part origin">
            <select
              value={input.partOrigin ?? "unknown"}
              onChange={(e) => set("partOrigin", e.target.value as PartOrigin)}
              className="flex h-9 w-full rounded-md border bg-transparent px-3 text-sm"
            >
              <option value="unknown">Unknown</option>
              <option value="oem">OEM (Original Equipment Manufacturer)</option>
              <option value="aftermarket">Aftermarket</option>
            </select>
          </Field>
          <div className="sm:col-span-2">
            <Field label="Postage info">
              <Input
                value={input.postageInfo ?? ""}
                onChange={(e) => set("postageInfo", e.target.value)}
                placeholder="e.g. Royal Mail Tracked 48, £4.95 — or collection only"
              />
            </Field>
          </div>
          <div className="sm:col-span-2 space-y-2">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="returnPolicy"
                checked={input.hasReturnPolicy ?? false}
                onChange={(e) => set("hasReturnPolicy", e.target.checked)}
                className="h-4 w-4 rounded border accent-primary"
              />
              <label htmlFor="returnPolicy" className="text-sm">I offer a return policy on this part</label>
            </div>
            {input.hasReturnPolicy && (
              <Textarea
                rows={2}
                value={input.returnPolicyDetails ?? ""}
                onChange={(e) => set("returnPolicyDetails", e.target.value)}
                placeholder="e.g. 14-day returns accepted, buyer pays return postage."
              />
            )}
          </div>
          {error && <p className="sm:col-span-2 text-sm text-destructive">{error}</p>}
          <div className="sm:col-span-2 flex gap-3">
            <Button type="submit" disabled={loading}>{loading ? "Saving…" : "Save changes"}</Button>
            <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

function Field({
  label,
  required,
  className,
  children,
}: {
  label: string;
  required?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={`space-y-1.5 ${className ?? ""}`}>
      <Label>
        {label}
        {required && <span className="text-destructive"> *</span>}
      </Label>
      {children}
    </div>
  );
}

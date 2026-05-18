"use client";

// In-page compatibility demo from the hero. The detailed checker lives at
// /listings/[id]; this compact version calls the same API endpoint.

import { useEffect, useMemo, useState } from "react";
import { computeTrustScore } from "@/lib/trust-score";
import { formatYearRange } from "@/lib/utils";
import type { CompatibilityResult, Listing, Vehicle } from "@/lib/types";

const TABS = ["Compatibility Check", "Part Details", "Seller Info"] as const;
type Tab = (typeof TABS)[number];

interface Props {
  listing: Listing;
  vehicles: Vehicle[];
}

export function CompatDemo({ listing, vehicles }: Props) {
  const trust = useMemo(() => computeTrustScore(listing), [listing]);

  const initial: Vehicle = useMemo(() => {
    const fit = listing.fitsVehicles[0];
    const match = vehicles.find(
      (v) => v.make === fit?.make && v.model === fit?.model && v.year >= fit.yearFrom && v.year <= fit.yearTo,
    );

    return match ?? vehicles[0] ?? {
      make: listing.input.make,
      model: listing.input.model,
      year: listing.input.yearFrom,
    };
  }, [listing, vehicles]);

  const [tab, setTab] = useState<Tab>("Compatibility Check");
  const [make, setMake] = useState(initial.make);
  const [model, setModel] = useState(initial.model);
  const [year, setYear] = useState<number>(initial.year);
  const [result, setResult] = useState<CompatibilityResult | null>(null);
  const [checking, setChecking] = useState(false);
  const [checkError, setCheckError] = useState<string | null>(null);

  const makes = useMemo(() => unique(vehicles.map((v) => v.make)), [vehicles]);
  const models = useMemo(() => unique(vehicles.map((v) => v.model)), [vehicles]);
  const years = useMemo(() => unique(vehicles.map((v) => v.year)).sort((a, b) => b - a), [vehicles]);

  useEffect(() => {
    const controller = new AbortController();

    async function runCheck() {
      setChecking(true);
      setCheckError(null);

      try {
        const res = await fetch("/api/compatibility", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            listingId: listing.id,
            vehicle: { make, model, year },
          }),
          signal: controller.signal,
        });

        if (!res.ok) throw new Error("Compatibility check failed.");
        setResult((await res.json()) as CompatibilityResult);
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return;
        setResult(null);
        setCheckError(err instanceof Error ? err.message : "Compatibility check failed.");
      } finally {
        if (!controller.signal.aborted) setChecking(false);
      }
    }

    runCheck();

    return () => controller.abort();
  }, [listing.id, make, model, year]);

  const rowClass =
    result?.verdict === "compatible"
      ? "result-row"
      : result?.verdict === "maybe"
      ? "result-row warning-result"
      : "result-row bad-result";

  const title =
    result?.verdict === "compatible"
      ? "Compatible"
      : result?.verdict === "maybe"
      ? "Check Required"
      : result
      ? "Not Compatible"
      : checking
      ? "Checking fit"
      : "Check unavailable";

  const icon = result?.verdict === "compatible" ? "OK" : result?.verdict === "maybe" ? "?" : "X";
  const fit = listing.fitsVehicles[0];
  const fitsLabel = fit ? `${fit.make} ${fit.model} ${formatYearRange(fit.yearFrom, fit.yearTo)}` : "-";
  const reasonText = result?.reasons.at(-1) ?? checkError ?? "Checking against compatibility data...";

  return (
    <div className="hero-demo-card" id="demo">
      <div className="tabs">
        {TABS.map((t) => (
          <button
            key={t}
            type="button"
            className={`tab ${t === tab ? "active" : ""}`}
            onClick={() => setTab(t)}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="part-summary">
        <div className="part-image" aria-hidden />
        <div className="part-info">
          <h2>{listing.generated.title}</h2>
          {listing.input.partNumber && <p>OEM Part: {listing.input.partNumber}</p>}
          <p>Condition: {prettyCondition(listing.input.condition)}</p>
          <p>Fits: {fitsLabel}</p>
        </div>
        <div className="trust-card">
          <p>Trust Score</p>
          <div className="shield">{trust.score}</div>
          <strong>{trustLabel(trust.band)}</strong>
          <span>Based on seller history, part quality &amp; feedback</span>
        </div>
      </div>

      {tab === "Compatibility Check" && (
        <>
          <div className="compatibility-box">
            <h3>Check compatibility with your vehicle</h3>

            <div className="form-grid">
              <label>
                Make
                <select value={make} onChange={(e) => setMake(e.target.value)}>
                  {makes.map((m) => <option key={m}>{m}</option>)}
                </select>
              </label>

              <label>
                Model
                <select value={model} onChange={(e) => setModel(e.target.value)}>
                  {models.map((m) => <option key={m}>{m}</option>)}
                </select>
              </label>

              <label>
                Year
                <select value={year} onChange={(e) => setYear(Number(e.target.value))}>
                  {years.map((y) => <option key={y} value={y}>{y}</option>)}
                </select>
              </label>

              <label>
                Trim
                <select defaultValue="-">
                  <option>-</option>
                  <option>SV</option>
                  <option>SE</option>
                  <option>M Sport</option>
                </select>
              </label>
            </div>

            <div className={rowClass}>
              <div className="result-left">
                <div className="check-icon">{icon}</div>
                <div>
                  <h4>{title}</h4>
                  <p>{reasonText}</p>
                </div>
              </div>

              <div className="confidence">
                <p>Confidence</p>
                <strong>{result ? `${Math.round(result.confidence * 100)}%` : "--"}</strong>
              </div>
            </div>
          </div>

          <div className="why-box">
            <div>
              <h3>Why it fits</h3>
              {result ? (
                <ul>
                  {result.reasons.map((r, i) => <li key={i}>{r}</li>)}
                </ul>
              ) : (
                <p>{checkError ?? "Loading compatibility reasons..."}</p>
              )}
            </div>
            <div className="car-outline">CAR</div>
          </div>
        </>
      )}

      {tab === "Part Details" && (
        <div className="compatibility-box">
          <h3>About this part</h3>
          <p style={{ marginBottom: 12, lineHeight: 1.55 }}>{listing.generated.description}</p>
          <ul style={{ listStyle: "none", padding: 0, display: "grid", gap: 8 }}>
            <li><strong>Type:</strong> {listing.input.partType}</li>
            <li><strong>Condition:</strong> {prettyCondition(listing.input.condition)}</li>
            <li><strong>Fits:</strong> {fitsLabel}</li>
            {listing.input.partNumber && <li><strong>OEM:</strong> {listing.input.partNumber}</li>}
            {listing.input.notes && <li><strong>Notes:</strong> {listing.input.notes}</li>}
          </ul>
        </div>
      )}

      {tab === "Seller Info" && (
        <div className="compatibility-box">
          <h3>{listing.seller.name}</h3>
          <ul style={{ listStyle: "none", padding: 0, display: "grid", gap: 8 }}>
            <li><strong>Status:</strong> {listing.seller.verified ? "Verified seller" : "Unverified"}</li>
            {listing.seller.rating != null && (
              <li><strong>Rating:</strong> {listing.seller.rating} ({listing.seller.reviewCount} reviews)</li>
            )}
            {listing.seller.location && <li><strong>Location:</strong> {listing.seller.location}</li>}
            <li><strong>Returns:</strong> {listing.input.hasReturnPolicy ? "Available" : "Not offered"}</li>
          </ul>
        </div>
      )}
    </div>
  );
}

function unique<T>(xs: T[]): T[] {
  return Array.from(new Set(xs));
}

function prettyCondition(c: Listing["input"]["condition"]): string {
  switch (c) {
    case "new": return "New";
    case "like-new": return "Like new";
    case "good": return "Good";
    case "fair": return "Fair";
    case "for-parts": return "For parts";
  }
}

function trustLabel(band: "low" | "medium" | "high"): string {
  return band === "high" ? "High Trust" : band === "medium" ? "Medium Trust" : "Low Trust";
}

"use client";

// Tinder-for-car-parts demo, backed by real listings + the trust score algorithm.
// The Like button hits /api/saves/:id so likes persist to the user's saved list
// (and the /saved page reflects them). When logged out, Like is disabled with a hint.

import { useState } from "react";
import Link from "next/link";
import { computeTrustScore } from "@/lib/trust-score";
import { formatPrice, formatYearRange } from "@/lib/utils";
import type { Listing } from "@/lib/types";

interface Props {
  listings: Listing[];
  initialSavedIds: string[];
  loggedIn: boolean;
}

export function PartSwiper({ listings, initialSavedIds, loggedIn }: Props) {
  const [index, setIndex] = useState(0);
  const [saved, setSaved] = useState<string[]>(initialSavedIds);
  const [compared, setCompared] = useState<string[]>([]);
  const [statsOpen, setStatsOpen] = useState(false);
  const [pendingLike, setPendingLike] = useState(false);

  if (listings.length === 0) {
    return (
      <section className="swipe-stage" style={{ display: "block", textAlign: "center", padding: "60px 0" }}>
        <p>No listings yet. <Link href="/sell" style={{ color: "var(--ar-red)", fontWeight: 800 }}>Be the first to list a part →</Link></p>
      </section>
    );
  }

  const listing = listings[index];
  const part = toDisplay(listing);
  const isLiked = saved.includes(listing.id);
  const isCompared = compared.includes(listing.id);

  function go(delta: number) {
    setStatsOpen(false);
    setIndex((i) => (i + delta + listings.length) % listings.length);
  }

  async function toggleLike() {
    if (!loggedIn || pendingLike) return;
    const next = !isLiked;
    setSaved((s) => (next ? [...s, listing.id] : s.filter((id) => id !== listing.id)));
    setPendingLike(true);
    try {
      const res = await fetch(`/api/saves/${encodeURIComponent(listing.id)}`, {
        method: next ? "POST" : "DELETE",
      });
      if (!res.ok) throw new Error(`save toggle failed: ${res.status}`);
    } catch (err) {
      console.error(err);
      setSaved((s) => (next ? s.filter((id) => id !== listing.id) : [...s, listing.id]));
    } finally {
      setPendingLike(false);
    }
  }

  function toggleCompare() {
    setCompared((c) => (c.includes(listing.id) ? c.filter((id) => id !== listing.id) : [...c, listing.id]));
  }

  const savedNames = saved
    .map((id) => listings.find((l) => l.id === id)?.generated.title)
    .filter((n): n is string => !!n);

  const likeLabel = isLiked ? "Liked ♥" : loggedIn ? "Like Part" : "Log in to like";

  return (
    <>
      <section className="swipe-stage">
        <button
          type="button"
          className="swipe-arrow left-arrow"
          aria-label="Previous part"
          onClick={() => go(-1)}
        >
          ←
        </button>

        <article className="part-swipe-card">
          <div className="swipe-card-top">
            <div>
              <p className="part-tag">{part.tag}</p>
              <h2>{part.name}</h2>
            </div>

            <div className="seller-box">
              <div className="seller-avatar">{part.sellerAvatar}</div>
              <div>
                <h3>{part.sellerName}</h3>
                <p>{part.sellerRating}</p>
              </div>
            </div>
          </div>

          <div className="swipe-card-main">
            <div className="component-image-wrap">
              <div
                className="component-image"
                style={{
                  backgroundImage: `linear-gradient(rgba(0,0,0,0.12), rgba(0,0,0,0.12)), url("${part.image}")`,
                }}
              />
            </div>

            <aside className="part-stats">
              <h3>Stats</h3>
              <div className="stat-row"><span>Fits</span><strong>{part.fitsLabel}</strong></div>
              <div className="stat-row"><span>Trust Score</span><strong>{part.trustScore}</strong></div>
              <div className="stat-row"><span>Condition</span><strong>{part.condition}</strong></div>
              <div className="stat-row"><span>Location</span><strong>{part.location}</strong></div>
            </aside>
          </div>

          <div className="swipe-card-bottom">
            <div>
              <p className="price-label">Price</p>
              <h3>{part.price}</h3>
            </div>

            <div className="swipe-actions">
              <button
                type="button"
                className={`compare-btn ${isCompared ? "active" : ""}`}
                onClick={toggleCompare}
              >
                {isCompared ? "Added to Compare ✓" : "Compare"}
              </button>
              <Link className="stats-btn" href={`/listings/${listing.id}`}>
                View full listing
              </Link>
              <button
                type="button"
                className="stats-btn"
                onClick={() => setStatsOpen(true)}
              >
                Full stats
              </button>
              <button
                type="button"
                className={`like-btn ${isLiked ? "liked" : ""}`}
                onClick={toggleLike}
                disabled={!loggedIn || pendingLike}
                title={loggedIn ? undefined : "Log in to like"}
              >
                {likeLabel}
              </button>
            </div>
          </div>
        </article>

        <button
          type="button"
          className="swipe-arrow right-arrow"
          aria-label="Next part"
          onClick={() => go(1)}
        >
          →
        </button>
      </section>

      <section className={`full-stats-panel ${statsOpen ? "show" : ""}`}>
        <div className="panel-header">
          <h2>{part.name} — Full stat list</h2>
          <button type="button" aria-label="Close" onClick={() => setStatsOpen(false)}>×</button>
        </div>

        <div className="stats-grid">
          <div><span>OEM Part Number</span><strong>{part.oem}</strong></div>
          <div><span>Vehicle Fitment</span><strong>{part.fitsLabel}</strong></div>
          <div><span>Part Type</span><strong>{part.partType}</strong></div>
          <div><span>Seller Verification</span><strong>{part.verification}</strong></div>
          <div><span>Return Policy</span><strong>{part.returns}</strong></div>
          <div><span>Trust Band</span><strong>{part.risk}</strong></div>
        </div>
      </section>

      <section className="saved-bar">
        <h2>Saved parts</h2>
        <p>
          {!loggedIn
            ? "Log in to save parts."
            : savedNames.length === 0
            ? "No parts liked yet."
            : savedNames.join(", ")}
        </p>
      </section>
    </>
  );
}

interface DisplayPart {
  tag: string;
  name: string;
  sellerAvatar: string;
  sellerName: string;
  sellerRating: string;
  image: string;
  fitsLabel: string;
  trustScore: string;
  condition: string;
  location: string;
  price: string;
  oem: string;
  partType: string;
  verification: string;
  returns: string;
  risk: string;
}

function toDisplay(listing: Listing): DisplayPart {
  const trust = computeTrustScore(listing);
  const fit = listing.fitsVehicles[0];
  const fitsLabel = fit ? `${fit.make} ${fit.model} ${formatYearRange(fit.yearFrom, fit.yearTo)}` : "—";

  return {
    tag:
      trust.band === "high"
        ? listing.seller.verified ? "Verified Match" : "High Trust Seller"
        : trust.band === "medium"
        ? "Check Details"
        : "Caution Advised",
    name: listing.generated.title,
    sellerAvatar: initials(listing.seller.name),
    sellerName: listing.seller.name,
    sellerRating:
      listing.seller.rating != null
        ? `★★★★★ ${listing.seller.rating} (${listing.seller.reviewCount ?? 0} reviews)`
        : "New seller",
    image: listing.input.images?.[0] ?? "/placeholder.svg",
    fitsLabel,
    trustScore: `${trust.score}/100`,
    condition: prettyCondition(listing.input.condition),
    location: listing.seller.location ?? "—",
    price: listing.input.price != null ? formatPrice(listing.input.price) : "POA",
    oem: listing.input.partNumber ?? "Not provided",
    partType: listing.input.partType,
    verification: listing.seller.verified ? "Verified" : "Unverified",
    returns: listing.input.hasReturnPolicy ? "Available" : "Not offered",
    risk: trust.band === "high" ? "High trust" : trust.band === "medium" ? "Medium trust" : "Low trust",
  };
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
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

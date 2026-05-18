"use client";

// Tinder-for-car-parts demo. Hardcoded swipeParts for now.
// TODO(stream-4): wire to lib/data.ts so the deck reflects real listings.

import { useState } from "react";

interface SwipePart {
  name: string;
  tag: string;
  sellerAvatar: string;
  sellerName: string;
  sellerRating: string;
  image: string;
  compatibility: string;
  trustScore: string;
  condition: string;
  delivery: string;
  price: string;
  oem: string;
  fitment: string;
  placement: string;
  verification: string;
  returns: string;
  risk: string;
}

const PARTS: SwipePart[] = [
  {
    name: "LED Headlight — Left Side",
    tag: "Verified Match",
    sellerAvatar: "RP",
    sellerName: "ReviveParts UK",
    sellerRating: "★★★★★ 4.8 seller rating",
    image: "https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?auto=format&fit=crop&w=1100&q=80",
    compatibility: "96%",
    trustScore: "87/100",
    condition: "Like New",
    delivery: "2–3 days",
    price: "£84.99",
    oem: "26060-4BA0A",
    fitment: "Nissan Rogue 2017–2020",
    placement: "Front Left",
    verification: "HMRC Checked",
    returns: "30 days",
    risk: "Low",
  },
  {
    name: "BMW 3 Series Alloy Wheel",
    tag: "High Trust Seller",
    sellerAvatar: "MW",
    sellerName: "Midlands Wheels",
    sellerRating: "★★★★★ 4.5 seller rating",
    image: "https://images.unsplash.com/photo-1601362840469-51e4d8d58785?auto=format&fit=crop&w=1100&q=80",
    compatibility: "89%",
    trustScore: "82/100",
    condition: "Good",
    delivery: "3–5 days",
    price: "£119.00",
    oem: "36116856052",
    fitment: "BMW 3 Series 2016–2019",
    placement: "Front / Rear",
    verification: "Business Verified",
    returns: "14 days",
    risk: "Low",
  },
  {
    name: "Ford Fiesta Wing Mirror",
    tag: "AI Fitment Checked",
    sellerAvatar: "FS",
    sellerName: "FastSpare Autos",
    sellerRating: "★★★★★ 4.3 seller rating",
    image: "https://images.unsplash.com/photo-1542362567-b07e54358753?auto=format&fit=crop&w=1100&q=80",
    compatibility: "91%",
    trustScore: "79/100",
    condition: "Used",
    delivery: "Next day",
    price: "£42.50",
    oem: "C1BB17683AJ",
    fitment: "Ford Fiesta 2013–2017",
    placement: "Driver Side",
    verification: "Seller ID Checked",
    returns: "14 days",
    risk: "Medium",
  },
  {
    name: "Toyota Corolla Rear Tail Light",
    tag: "Eco Reused Part",
    sellerAvatar: "GC",
    sellerName: "GreenCycle Parts",
    sellerRating: "★★★★★ 4.9 seller rating",
    image: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1100&q=80",
    compatibility: "94%",
    trustScore: "91/100",
    condition: "Excellent",
    delivery: "2–4 days",
    price: "£68.00",
    oem: "81551-02B20",
    fitment: "Toyota Corolla 2019–2022",
    placement: "Rear Left",
    verification: "HMRC Checked",
    returns: "30 days",
    risk: "Very Low",
  },
];

export function PartSwiper() {
  const [index, setIndex] = useState(0);
  const [saved, setSaved] = useState<string[]>([]);
  const [compared, setCompared] = useState<string[]>([]);
  const [statsOpen, setStatsOpen] = useState(false);

  const part = PARTS[index];
  const isLiked = saved.includes(part.name);
  const isCompared = compared.includes(part.name);

  function go(delta: number) {
    setStatsOpen(false);
    setIndex((i) => (i + delta + PARTS.length) % PARTS.length);
  }

  function toggleLike() {
    setSaved((s) => (s.includes(part.name) ? s.filter((n) => n !== part.name) : [...s, part.name]));
  }

  function toggleCompare() {
    setCompared((c) => (c.includes(part.name) ? c.filter((n) => n !== part.name) : [...c, part.name]));
  }

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
              <div className="stat-row"><span>Compatibility</span><strong>{part.compatibility}</strong></div>
              <div className="stat-row"><span>Trust Score</span><strong>{part.trustScore}</strong></div>
              <div className="stat-row"><span>Condition</span><strong>{part.condition}</strong></div>
              <div className="stat-row"><span>Delivery</span><strong>{part.delivery}</strong></div>
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
              <button
                type="button"
                className="stats-btn"
                onClick={() => setStatsOpen(true)}
              >
                Check Full Stat List
              </button>
              <button
                type="button"
                className={`like-btn ${isLiked ? "liked" : ""}`}
                onClick={toggleLike}
              >
                {isLiked ? "Liked ♥" : "Like Part"}
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
          <div><span>Vehicle Fitment</span><strong>{part.fitment}</strong></div>
          <div><span>Placement</span><strong>{part.placement}</strong></div>
          <div><span>Seller Verification</span><strong>{part.verification}</strong></div>
          <div><span>Return Policy</span><strong>{part.returns}</strong></div>
          <div><span>AI Risk Level</span><strong>{part.risk}</strong></div>
        </div>
      </section>

      <section className="saved-bar">
        <h2>Saved parts</h2>
        <p>{saved.length === 0 ? "No parts liked yet." : saved.join(", ")}</p>
      </section>
    </>
  );
}

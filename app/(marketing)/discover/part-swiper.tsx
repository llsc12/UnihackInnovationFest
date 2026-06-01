"use client";

// Tinder-for-car-parts. Drag a card right to like (saves to the user's /saved
// list via /api/saves/:id), left to pass. Buttons mirror the gestures. The deck
// is one-pass and excludes parts the user already saved; when it runs out we
// show an "all caught up" state.

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import Link from "next/link";
import {
  motion,
  useAnimationControls,
  useMotionValue,
  useTransform,
} from "framer-motion";
import { computeTrustScore } from "@/lib/trust-score";
import { formatPrice, formatYearRange } from "@/lib/utils";
import type { Listing } from "@/lib/types";

const SWIPE_THRESHOLD = 120;
const VELOCITY_THRESHOLD = 600;

interface Props {
  listings: Listing[];
  initialSavedIds: string[];
  loggedIn: boolean;
}

export function PartSwiper({ listings, initialSavedIds, loggedIn }: Props) {
  // One-pass deck: drop anything already saved so it never reappears.
  const deck = useMemo(
    () => listings.filter((l) => !initialSavedIds.includes(l.id)),
    [listings, initialSavedIds],
  );

  const [index, setIndex] = useState(0);
  const [likedCount, setLikedCount] = useState(0);
  const [hint, setHint] = useState<string | null>(null);
  const topRef = useRef<SwipeCardHandle>(null);

  const done = index >= deck.length;
  const current = deck[index];
  const peek = deck[index + 1];

  const persistLike = useCallback((id: string) => {
    // Optimistic — the card has already flown off. Log on failure; there is no
    // visible state to roll back to since we've advanced.
    fetch(`/api/saves/${encodeURIComponent(id)}`, { method: "POST" })
      .then((res) => {
        if (!res.ok) throw new Error(`save failed: ${res.status}`);
      })
      .catch((err) => console.error(err));
  }, []);

  const vote = useCallback(
    (dir: 1 | -1, id: string) => {
      if (dir === 1) {
        if (loggedIn) {
          persistLike(id);
          setLikedCount((c) => c + 1);
        } else {
          setHint("Log in to save parts you like.");
        }
      }
      setIndex((i) => i + 1);
    },
    [loggedIn, persistLike],
  );

  // Keyboard: ←/→ pass/like the top card.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "ArrowRight") topRef.current?.fling(1);
      else if (e.key === "ArrowLeft") topRef.current?.fling(-1);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  if (deck.length === 0) {
    return (
      <section className="swipe-empty">
        {initialSavedIds.length > 0 ? (
          <>
            <h2>You&apos;ve swiped through everything.</h2>
            <p>
              Check your{" "}
              <Link href="/saved" className="swipe-link">
                saved parts
              </Link>{" "}
              or{" "}
              <Link href="/listings" className="swipe-link">
                browse the full catalogue
              </Link>
              .
            </p>
          </>
        ) : (
          <>
            <h2>No parts to discover yet.</h2>
            <p>
              <Link href="/sell" className="swipe-link">
                Be the first to list a part →
              </Link>
            </p>
          </>
        )}
      </section>
    );
  }

  if (done) {
    return (
      <section className="swipe-empty">
        <h2>You&apos;re all caught up.</h2>
        <p>
          {likedCount > 0
            ? `You liked ${likedCount} part${likedCount === 1 ? "" : "s"} this session.`
            : "No likes this session."}
        </p>
        <div className="swipe-empty-actions">
          {loggedIn && (
            <Link href="/saved" className="swipe-link-btn">
              View saved parts
            </Link>
          )}
          <Link href="/listings" className="swipe-link-btn ghost">
            Browse all parts
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="swipe-deck-wrap">
      <div className="swipe-deck">
        {peek && <StaticCard key={peek.id} listing={peek} />}
        <SwipeCard
          key={current.id}
          ref={topRef}
          listing={current}
          onVote={(dir) => vote(dir, current.id)}
        />
      </div>

      <div className="swipe-controls">
        <button
          type="button"
          className="swipe-action pass"
          aria-label="Pass"
          onClick={() => topRef.current?.fling(-1)}
        >
          ✕
        </button>
        <button
          type="button"
          className="swipe-action like"
          aria-label="Like"
          onClick={() => topRef.current?.fling(1)}
        >
          ♥
        </button>
      </div>

      <p className="swipe-progress">
        {index + 1} / {deck.length}
        {hint && <span className="swipe-hint"> · {hint}</span>}
      </p>
    </section>
  );
}

// ── Top (interactive) card ─────────────────────────────────────────────────────

interface SwipeCardHandle {
  fling: (dir: 1 | -1) => void;
}

interface SwipeCardProps {
  listing: Listing;
  onVote: (dir: 1 | -1) => void;
}

const SwipeCard = forwardRef<SwipeCardHandle, SwipeCardProps>(function SwipeCard(
  { listing, onVote },
  ref,
) {
  const controls = useAnimationControls();
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-240, 240], [-16, 16]);
  const likeOpacity = useTransform(x, [30, 130], [0, 1]);
  const nopeOpacity = useTransform(x, [-130, -30], [1, 0]);
  const [flinging, setFlinging] = useState(false);

  const fling = useCallback(
    (dir: 1 | -1) => {
      if (flinging) return;
      setFlinging(true);
      controls
        .start({
          x: dir * 1100,
          rotate: dir * 22,
          opacity: 0,
          transition: { duration: 0.32, ease: "easeOut" },
        })
        .then(() => onVote(dir));
    },
    [controls, flinging, onVote],
  );

  useImperativeHandle(ref, () => ({ fling }), [fling]);

  const part = toDisplay(listing);

  return (
    <motion.article
      className="tinder-card"
      style={{ x, rotate }}
      drag={flinging ? false : "x"}
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.7}
      animate={controls}
      onDragEnd={(_, info) => {
        if (info.offset.x > SWIPE_THRESHOLD || info.velocity.x > VELOCITY_THRESHOLD) {
          fling(1);
        } else if (
          info.offset.x < -SWIPE_THRESHOLD ||
          info.velocity.x < -VELOCITY_THRESHOLD
        ) {
          fling(-1);
        }
      }}
    >
      <motion.div className="swipe-stamp like" style={{ opacity: likeOpacity }}>
        LIKE
      </motion.div>
      <motion.div className="swipe-stamp nope" style={{ opacity: nopeOpacity }}>
        NOPE
      </motion.div>
      <CardFace part={part} listingId={listing.id} interactive />
    </motion.article>
  );
});

// ── Behind (decorative) card ───────────────────────────────────────────────────

function StaticCard({ listing }: { listing: Listing }) {
  return (
    <article className="tinder-card peek" aria-hidden="true">
      <CardFace part={toDisplay(listing)} listingId={listing.id} interactive={false} />
    </article>
  );
}

// ── Shared card face ───────────────────────────────────────────────────────────

function CardFace({
  part,
  listingId,
  interactive,
}: {
  part: DisplayPart;
  listingId: string;
  interactive: boolean;
}) {
  return (
    <>
      <div
        className="tinder-photo"
        style={{
          backgroundImage: `linear-gradient(rgba(0,0,0,0) 40%, rgba(0,0,0,0.78)), url("${part.image}")`,
        }}
      >
        <span className={`tinder-trust ${part.band}`}>{part.tag}</span>
        <span className="tinder-price">{part.price}</span>
      </div>

      <div className="tinder-body">
        <h2>{part.name}</h2>
        <p className="tinder-seller">
          {part.sellerName}
          {part.verification === "Verified" && <span className="tinder-verified"> · ✓ Verified</span>}
        </p>

        <dl className="tinder-stats">
          <div>
            <dt>Fits</dt>
            <dd>{part.fitsLabel}</dd>
          </div>
          <div>
            <dt>Condition</dt>
            <dd>{part.condition}</dd>
          </div>
          <div>
            <dt>Trust</dt>
            <dd>{part.trustScore}</dd>
          </div>
        </dl>

        {interactive && (
          <Link
            href={`/listings/${listingId}`}
            className="tinder-view"
            // Don't let a tap on the link start a drag.
            onPointerDownCapture={(e) => e.stopPropagation()}
          >
            View full listing →
          </Link>
        )}
      </div>
    </>
  );
}

// ── Display mapping (unchanged logic, reused from the old carousel) ─────────────

interface DisplayPart {
  tag: string;
  band: string;
  name: string;
  sellerName: string;
  image: string;
  fitsLabel: string;
  trustScore: string;
  condition: string;
  price: string;
  partType: string;
  verification: string;
}

function toDisplay(listing: Listing): DisplayPart {
  const trust = computeTrustScore(listing);
  const fit = listing.fitsVehicles[0];
  const fitsLabel = fit
    ? `${fit.make} ${fit.model} ${formatYearRange(fit.yearFrom, fit.yearTo)}`
    : "—";

  return {
    tag:
      trust.band === "high"
        ? listing.seller.verified
          ? "Verified Match"
          : "High Trust"
        : trust.band === "medium"
        ? "Check Details"
        : "Caution",
    band: trust.band,
    name: listing.generated.title,
    sellerName: listing.seller.name,
    image: listing.input.images?.[0] ?? "/placeholder.svg",
    fitsLabel,
    trustScore: `${trust.score}/100`,
    condition: prettyCondition(listing.input.condition),
    price: listing.input.price != null ? formatPrice(listing.input.price) : "POA",
    partType: listing.input.partType,
    verification: listing.seller.verified ? "Verified" : "Unverified",
  };
}

function prettyCondition(c: Listing["input"]["condition"]): string {
  switch (c) {
    case "new":
      return "New";
    case "like-new":
      return "Like new";
    case "good":
      return "Good";
    case "fair":
      return "Fair";
    case "for-parts":
      return "For parts";
  }
}

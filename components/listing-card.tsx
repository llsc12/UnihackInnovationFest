// AutoReviver-branded listing card. Used on /listings and /saved.
// Visual style matches app/autoreviver.css `.browse-card` rules.

import Link from "next/link";
import type { Listing } from "@/lib/types";
import { computeTrustScore } from "@/lib/trust-score";
import { formatPrice, formatYearRange } from "@/lib/utils";

export function ListingCard({ listing }: { listing: Listing }) {
  const trust = computeTrustScore(listing);
  const image = listing.input.images?.[0] ?? "/placeholder.svg";
  const fit = listing.fitsVehicles[0];
  const fitsLabel = fit ? `Fits ${fit.make} ${fit.model} ${formatYearRange(fit.yearFrom, fit.yearTo)}` : null;

  return (
    <Link href={`/listings/${listing.id}`} className="browse-card">
      <div
        className="browse-card-image"
        style={{ backgroundImage: `url("${image}")` }}
        aria-hidden
      />
      <div className="browse-card-body">
        <div className="browse-card-chips">
          <span className="browse-card-chip part">{listing.input.partType}</span>
          <span className="browse-card-chip vehicle">
            {listing.input.make} {listing.input.model}{" "}
            {formatYearRange(listing.input.yearFrom, listing.input.yearTo)}
          </span>
        </div>
        <div className="browse-card-title">{listing.generated.title}</div>
        {fitsLabel && <div className="browse-card-fits">{fitsLabel}</div>}
      </div>
      <div className="browse-card-footer">
        <span className="browse-card-price">{formatPrice(listing.input.price)}</span>
        <span className={`browse-card-trust ${trust.band}`}>Trust {trust.score}</span>
      </div>
    </Link>
  );
}

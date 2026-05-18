export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import { getSellerById, getListingsBySeller } from "@/lib/data";
import { ListingCard } from "@/components/listing-card";
import { formatYearRange } from "@/lib/utils";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function SellerProfilePage({ params }: PageProps) {
  const { id } = await params;
  const [seller, listings] = await Promise.all([
    getSellerById(id),
    getListingsBySeller(id),
  ]);

  if (!seller) notFound();

  const initials = seller.name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="seller-profile">
      <div className="seller-profile-header">
        <div className="seller-avatar-large">{initials}</div>
        <div className="seller-profile-info">
          <div className="seller-profile-name">
            {seller.name}
            {seller.verified && (
              <span className="seller-verified-badge">✓ Verified</span>
            )}
          </div>
          <div className="seller-profile-meta">
            {seller.rating != null && (
              <span>★ {seller.rating.toFixed(1)} ({seller.reviewCount ?? 0} reviews)</span>
            )}
            {seller.location && <span>📍 {seller.location}</span>}
            <span>{listings.length} listing{listings.length === 1 ? "" : "s"}</span>
          </div>
        </div>
      </div>

      <h2 className="seller-profile-section-title">
        Parts listed by {seller.name}
      </h2>

      {listings.length === 0 ? (
        <p className="browse-empty">This seller has no active listings.</p>
      ) : (
        <div className="browse-grid">
          {listings.map((listing) => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </div>
      )}
    </div>
  );
}

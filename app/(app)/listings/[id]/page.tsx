// STREAM 3 — listing detail page. Shows image gallery, trust score, save button,
// and the compatibility checker (Stream 2's UI).
export const dynamic = "force-dynamic";

import Link from "next/link";
import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import { getListingById, getVehicles, isListingSaved } from "@/lib/data";
import { createSessionServerClient } from "@/lib/supabase";
import { computeTrustScore } from "@/lib/trust-score";
import { detectPriceAnomaly } from "@/lib/price-anomaly";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TrustScoreBadge } from "@/components/trust-score-badge";
import { SaveButton } from "@/components/save-button";
import { CompatibilityChecker } from "./compatibility-checker";
import { ImageGallery } from "@/components/image-gallery";
import { formatPrice, formatYearRange } from "@/lib/utils";
import { CheckCircle2, XCircle, MinusCircle } from "lucide-react";

interface PageProps {
  params: Promise<{ id: string }>;
}

const ORIGIN_LABEL: Record<string, string> = {
  oem: "OEM",
  aftermarket: "Aftermarket",
  unknown: "Unknown origin",
};

export default async function ListingDetailPage({ params }: PageProps) {
  const { id } = await params;
  const listing = await getListingById(id);
  if (!listing) notFound();

  const [priceAnomaly, vehicles] = await Promise.all([
    detectPriceAnomaly(listing),
    getVehicles(),
  ]);
  const trust = computeTrustScore(listing, { priceAnomalyFlag: priceAnomaly.flag });

  const cookieStore = await cookies();
  const supabase = createSessionServerClient(cookieStore);
  const { data: { user } } = await supabase.auth.getUser();
  const isOwner = user != null && listing.userId === user.id;
  const initiallySaved = user ? await isListingSaved(user.id, listing.id) : false;


  const images = listing.input.images?.length ? listing.input.images : ["/placeholder.svg"];

  const { seller } = listing;

  return (
    <div className="grid gap-8 lg:grid-cols-3">
      <div className="lg:col-span-2 space-y-6">
        <ImageGallery images={images} alt={listing.generated.title} />

        {priceAnomaly.flag && priceAnomaly.reason && (
          <div className="flex items-start gap-3 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            <span className="mt-0.5 shrink-0 text-base">⚠</span>
            <p>{priceAnomaly.reason}</p>
          </div>
        )}

        <header className="space-y-3">
          <div className="flex items-start justify-between gap-4">
            <h1 className="text-3xl font-bold">{listing.generated.title}</h1>
            {isOwner && (
              <Button asChild variant="outline" size="sm" className="shrink-0">
                <Link href={`/listings/${listing.id}/edit`}>Edit listing</Link>
              </Button>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline">{listing.input.partType}</Badge>
            <Badge variant="secondary">
              {listing.input.make} {listing.input.model}{" "}
              {formatYearRange(listing.input.yearFrom, listing.input.yearTo)}
            </Badge>
            {listing.input.partNumber && <Badge>Part #{listing.input.partNumber}</Badge>}
            {listing.input.partOrigin && listing.input.partOrigin !== "unknown" && (
              <Badge variant="outline">{ORIGIN_LABEL[listing.input.partOrigin]}</Badge>
            )}
            <span className="ml-auto text-2xl font-semibold">{formatPrice(listing.input.price)}</span>
          </div>
        </header>

        <Card>
          <CardHeader>
            <CardTitle>Description</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm leading-relaxed">
            <p>{listing.generated.description}</p>
            <p className="text-muted-foreground">{listing.generated.conditionNotes}</p>
            <p className="text-muted-foreground">{listing.generated.compatibilitySummary}</p>
            {listing.input.postageInfo && (
              <p className="border-t pt-3">
                <span className="font-medium">Postage: </span>
                {listing.input.postageInfo}
              </p>
            )}
            {listing.input.hasReturnPolicy && (
              <p>
                <span className="font-medium">Returns: </span>
                {listing.input.returnPolicyDetails || "Return policy offered — contact seller for details."}
              </p>
            )}
          </CardContent>
        </Card>

        <CompatibilityChecker listingId={listing.id} vehicles={vehicles} />
      </div>

      <aside className="space-y-6">
        <div className="flex items-center gap-3">
          <SaveButton
            listingId={listing.id}
            initiallySaved={initiallySaved}
            loggedIn={user != null}
          />
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Trust score
              <TrustScoreBadge score={trust.score} band={trust.band} />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1.5 text-sm">
              {trust.signals.map((s) => (
                <li key={s.key} className="flex items-center gap-2">
                  {s.passed ? (
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                  ) : s.partial ? (
                    <MinusCircle className="h-4 w-4 shrink-0 text-amber-500" />
                  ) : (
                    <XCircle className="h-4 w-4 shrink-0 text-muted-foreground" />
                  )}
                  <span className={s.passed || s.partial ? "" : "text-muted-foreground"}>
                    {s.label}
                  </span>
                  <span className="ml-auto text-xs text-muted-foreground">{s.weight}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Seller</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1.5 text-sm">
            {seller.username ? (
              <>
                <p className="font-medium">
                  <Link href={seller.profileUrl!} className="hover:underline">
                    @{seller.username}
                  </Link>
                  {" "}
                  {seller.verified && <Badge variant="success">Verified</Badge>}
                </p>
                {seller.fullName && (
                  <p className="text-muted-foreground">{seller.fullName}</p>
                )}
                {seller.memberSince && (
                  <p className="text-muted-foreground">
                    Member since{" "}
                    {new Date(seller.memberSince).toLocaleDateString("en-GB", {
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                )}
              </>
            ) : (
              <p className="font-medium">
                {seller.name}{" "}
                {seller.verified && <Badge variant="success">Verified</Badge>}
              </p>
            )}
            {seller.rating != null && (
              <p className="text-muted-foreground">
                ★ {seller.rating} ({seller.reviewCount} reviews)
              </p>
            )}
            {seller.location && (
              <p className="text-muted-foreground">{seller.location}</p>
            )}
          </CardContent>
        </Card>
      </aside>
    </div>
  );
}

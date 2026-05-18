// STREAM 3 — listing detail page. Shows image gallery, trust score, save button,
// and the compatibility checker (Stream 2's UI).
export const dynamic = "force-dynamic";

import Link from "next/link";
import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import { getListingById, isListingSaved } from "@/lib/data";
import { createSessionServerClient } from "@/lib/supabase";
import { computeTrustScore } from "@/lib/trust-score";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TrustScoreBadge } from "@/components/trust-score-badge";
import { SaveButton } from "@/components/save-button";
import { CompatibilityChecker } from "./compatibility-checker";
import { formatPrice, formatYearRange } from "@/lib/utils";
import { CheckCircle2, XCircle } from "lucide-react";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ListingDetailPage({ params }: PageProps) {
  const { id } = await params;
  const listing = await getListingById(id);
  if (!listing) notFound();

  const trust = computeTrustScore(listing);

  const cookieStore = await cookies();
  const supabase = createSessionServerClient(cookieStore);
  const { data: { user } } = await supabase.auth.getUser();
  const isOwner = user != null && listing.userId === user.id;
  const initiallySaved = user ? await isListingSaved(user.id, listing.id) : false;

  const images = listing.input.images?.length ? listing.input.images : ["/placeholder.svg"];
  const [primaryImage, ...thumbs] = images;

  return (
    <div className="grid gap-8 lg:grid-cols-3">
      <div className="lg:col-span-2 space-y-6">
        <div className="detail-gallery">
          <div className="detail-gallery-main" style={{ backgroundImage: `url("${primaryImage}")` }} aria-hidden />
          {thumbs.length > 0 && (
            <div className="detail-gallery-thumbs">
              {thumbs.map((src, i) => (
                <div
                  key={i}
                  className="detail-gallery-thumb"
                  style={{ backgroundImage: `url("${src}")` }}
                  aria-hidden
                />
              ))}
            </div>
          )}
        </div>

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
          </CardContent>
        </Card>

        <CompatibilityChecker listingId={listing.id} />
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
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  ) : (
                    <XCircle className="h-4 w-4 text-muted-foreground" />
                  )}
                  <span className={s.passed ? "" : "text-muted-foreground"}>{s.label}</span>
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
          <CardContent className="space-y-1 text-sm">
            <p className="font-medium">
              {listing.seller.name}{" "}
              {listing.seller.verified && <Badge variant="success">Verified</Badge>}
            </p>
            {listing.seller.rating != null && (
              <p className="text-muted-foreground">
                ★ {listing.seller.rating} ({listing.seller.reviewCount} reviews)
              </p>
            )}
            {listing.seller.location && (
              <p className="text-muted-foreground">{listing.seller.location}</p>
            )}
          </CardContent>
        </Card>
      </aside>
    </div>
  );
}

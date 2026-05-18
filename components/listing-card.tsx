import Link from "next/link";
import type { Listing } from "@/lib/types";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrustScoreBadge } from "@/components/trust-score-badge";
import { computeTrustScore } from "@/lib/trust-score";
import { formatPrice, formatYearRange } from "@/lib/utils";

export function ListingCard({ listing }: { listing: Listing }) {
  const trust = computeTrustScore(listing);
  return (
    <Link href={`/listings/${listing.id}`}>
      <Card className="h-full transition-shadow hover:shadow-md">
        <CardHeader>
          <CardTitle className="line-clamp-2 text-base">{listing.generated.title}</CardTitle>
          <div className="flex items-center gap-2 pt-2">
            <Badge variant="outline">{listing.input.partType}</Badge>
            <Badge variant="secondary">
              {listing.input.make} {listing.input.model}{" "}
              {formatYearRange(listing.input.yearFrom, listing.input.yearTo)}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <p className="line-clamp-3 text-sm text-muted-foreground">
            {listing.generated.description}
          </p>
        </CardContent>
        <CardFooter className="flex items-center justify-between">
          <span className="text-lg font-semibold">{formatPrice(listing.input.price)}</span>
          <TrustScoreBadge score={trust.score} band={trust.band} />
        </CardFooter>
      </Card>
    </Link>
  );
}

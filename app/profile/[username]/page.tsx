export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import Link from "next/link";
import { cookies } from "next/headers";
import { getPublicProfile, getOwnProfile, getListingsByUser } from "@/lib/data";
import { createSessionServerClient } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ProfileSettings } from "./profile-settings";
import { formatPrice } from "@/lib/utils";

interface PageProps {
  params: Promise<{ username: string }>;
}

export default async function ProfilePage({ params }: PageProps) {
  const { username } = await params;
  const publicProfile = await getPublicProfile(username);
  if (!publicProfile) notFound();

  const cookieStore = await cookies();
  const supabase = createSessionServerClient(cookieStore);
  const { data: { user } } = await supabase.auth.getUser();

  const isOwner = user?.id === publicProfile.id;
  // Only fetch full OwnProfile (with DOB) when rendering the owner's own page
  const ownProfile = isOwner ? await getOwnProfile(user!.id).catch(() => null) : null;

  const listings = await getListingsByUser(publicProfile.id);

  return (
    <div className="space-y-8 max-w-3xl mx-auto">
      {/* Profile header */}
      <div className="space-y-1">
        <h1 className="text-3xl font-bold">@{publicProfile.username}</h1>
        {publicProfile.fullName && (
          <p className="text-lg text-muted-foreground">{publicProfile.fullName}</p>
        )}
        <p className="text-sm text-muted-foreground">
          Member since{" "}
          {new Date(publicProfile.memberSince).toLocaleDateString("en-GB", {
            month: "long",
            year: "numeric",
          })}
        </p>
      </div>

      {/* Listings */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">
          Listings {listings.length > 0 && <span className="text-muted-foreground font-normal text-base">({listings.length})</span>}
        </h2>
        {listings.length === 0 ? (
          <p className="text-muted-foreground text-sm">No listings yet.</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {listings.map((listing) => (
              <Link key={listing.id} href={`/listings/${listing.id}`}>
                <Card className="hover:border-primary transition-colors cursor-pointer h-full">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base leading-snug">{listing.generated.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-1.5 text-sm">
                    <div className="flex flex-wrap gap-1.5">
                      <Badge variant="outline">{listing.input.partType}</Badge>
                      <Badge variant="secondary">
                        {listing.input.make} {listing.input.model}
                      </Badge>
                      <Badge variant="secondary">{listing.input.condition}</Badge>
                    </div>
                    <p className="font-semibold">{formatPrice(listing.input.price)}</p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Account settings — owner only */}
      {isOwner && ownProfile && (
        <section className="space-y-4">
          <h2 className="text-xl font-semibold">Account settings</h2>
          <ProfileSettings profile={ownProfile} />
        </section>
      )}
    </div>
  );
}

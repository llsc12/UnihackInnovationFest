import { notFound, redirect } from "next/navigation";
import { cookies } from "next/headers";
import { getListingById } from "@/lib/data";
import { createSessionServerClient } from "@/lib/supabase";
import { EditListingForm } from "./edit-listing-form";

export const dynamic = "force-dynamic";

export default async function EditListingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const cookieStore = await cookies();
  const supabase = createSessionServerClient(cookieStore);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const listing = await getListingById(id);
  if (!listing) notFound();
  if (listing.userId !== user.id) notFound();

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Edit listing</h1>
      <EditListingForm listing={listing} />
    </div>
  );
}

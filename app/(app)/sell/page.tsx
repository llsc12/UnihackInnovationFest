// STREAM 1 — Seller listing creation flow.

import { SellForm } from "./sell-form";

export default function SellPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold">List a part</h1>
        <p className="text-muted-foreground">
          Fill in the basics. AutoReviver will turn it into a clean, structured listing.
        </p>
      </header>
      <SellForm />
    </div>
  );
}

// Layout for the working app surfaces: browse, listing detail, sell form.
// Shares the dark AutoReviver header with the marketing pages so navigation
// stays consistent across the whole app. The .autoreviver-landing wrapper
// applies the design-system base styles (font, background, link colours).

import { SiteHeader } from "@/components/site-header";
import "../autoreviver.css";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="autoreviver-landing">
      <SiteHeader />
      <main className="container py-8">{children}</main>
    </div>
  );
}

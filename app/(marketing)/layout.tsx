// Layout for the marketing surfaces: landing page (/) and part-swipe (/discover).
// Wraps content in .autoreviver-landing so the AutoReviver design system styles
// (body/img/a globals + hero/swipe sections) apply within this group.

import { SiteHeader } from "@/components/site-header";
import "../autoreviver.css";

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="autoreviver-landing">
      <SiteHeader />
      {children}
    </div>
  );
}

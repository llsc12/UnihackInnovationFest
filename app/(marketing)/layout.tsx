// Layout for the marketing surfaces: landing page (/) and part-swipe (/discover).
// Wraps content in .autoreviver-landing so the imported landing.css applies
// without leaking body/img/a rules into the rest of the app.

import { SiteHeader } from "./site-header";
import "./landing.css";

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="autoreviver-landing">
      <SiteHeader />
      {children}
    </div>
  );
}

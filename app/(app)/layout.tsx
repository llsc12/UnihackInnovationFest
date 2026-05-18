// Layout for the working app surfaces: browse, listing detail, sell form.
// The marketing surfaces (landing + part-swipe discover) use their own layout
// at app/(marketing)/layout.tsx.

import { Nav } from "@/components/nav";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Nav />
      <main className="container py-8">{children}</main>
    </>
  );
}

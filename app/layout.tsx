import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AutoReviver",
  description: "Smarter listings and compatibility checks for used car parts.",
};

// Root layout is intentionally minimal — the two route groups
// app/(app)/layout.tsx and app/(marketing)/layout.tsx provide their own
// headers, wrappers, and AutoReviver styles.
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-background font-sans antialiased">
        {children}
      </body>
    </html>
  );
}

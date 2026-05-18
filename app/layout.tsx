import type { Metadata } from "next";
import "./globals.css";
import { Nav } from "@/components/nav";

export const metadata: Metadata = {
  title: "AutoReviver",
  description: "Smarter listings and compatibility checks for used car parts.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-background font-sans antialiased">
        <Nav />
        <main className="container py-8">{children}</main>
      </body>
    </html>
  );
}

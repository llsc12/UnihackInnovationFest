"use client";

// Heart/save toggle. Optimistic — flips state instantly, reverts on API error.
// When `loggedIn === false` the button is disabled with a "Log in to save" hint
// and the click is a no-op. Used on listing detail and the discover swipe deck.

import { useState } from "react";
import { Heart } from "lucide-react";

interface Props {
  listingId: string;
  initiallySaved: boolean;
  loggedIn: boolean;
  className?: string;
  size?: "default" | "compact";
}

export function SaveButton({ listingId, initiallySaved, loggedIn, className, size = "default" }: Props) {
  const [saved, setSaved] = useState(initiallySaved);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function toggle() {
    if (!loggedIn || pending) return;
    const next = !saved;
    setSaved(next);
    setPending(true);
    setError(null);
    try {
      const res = await fetch(`/api/saves/${encodeURIComponent(listingId)}`, {
        method: next ? "POST" : "DELETE",
      });
      if (!res.ok) throw new Error(`save toggle failed: ${res.status}`);
    } catch {
      setSaved(!next); // revert
      setError("Saving is unavailable until the database migration runs.");
    } finally {
      setPending(false);
    }
  }

  const label = saved ? "Saved" : loggedIn ? "Save" : "Log in to save";
  const heartFill = saved ? "currentColor" : "none";

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={!loggedIn}
      title={loggedIn ? undefined : "Log in to save"}
      aria-pressed={saved}
      className={`save-button ${saved ? "saved" : ""} ${size === "compact" ? "compact" : ""} ${className ?? ""}`.trim()}
    >
      <Heart className="h-4 w-4" fill={heartFill} strokeWidth={2} />
      <span>{label}</span>
      {error && <span className="sr-only">{error}</span>}
    </button>
  );
}

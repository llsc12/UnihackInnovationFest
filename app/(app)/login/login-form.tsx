"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { createBrowserClient } from "@/lib/supabase";

type Mode = "login" | "register";
type PrivacyMode = "public" | "private";

export function LoginForm() {
  const searchParams = useSearchParams();
  const requestedMode: Mode =
    searchParams.get("mode") === "signup" ? "register" : "login";

  const [mode, setMode] = useState<Mode>(requestedMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  // registration-only fields
  const [username, setUsername] = useState("");
  const [fullName, setFullName] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [privacyMode, setPrivacyMode] = useState<PrivacyMode>("public");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Re-sync the form when the header switches between /login and /login?mode=signup.
  // Client-side navigation doesn't remount this component, so useState alone would
  // keep the stale mode — this effect keeps the form in step with the URL.
  useEffect(() => {
    setMode(requestedMode);
    setError(null);
  }, [requestedMode]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createBrowserClient();

    if (mode === "login") {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) {
        setError(error.message);
        setLoading(false);
        return;
      }
    } else {
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
      });
      if (signUpError) {
        setError(signUpError.message);
        setLoading(false);
        return;
      }

      // Pass the access token explicitly — the session cookie may not be set
      // in the browser yet when this fetch fires immediately after signUp.
      const token = signUpData.session?.access_token;
      const res = await fetch("/api/profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ username, fullName, dateOfBirth, privacyMode }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.error ?? "Failed to create profile");
        setLoading(false);
        return;
      }
    }

    window.location.assign("/");
  }

  function switchMode(next: Mode) {
    setMode(next);
    setError(null);
  }

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>{mode === "login" ? "Sign in" : "Create account"}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete={
                mode === "login" ? "current-password" : "new-password"
              }
              minLength={6}
            />
          </div>

          {mode === "register" && (
            <>
              <div className="space-y-1.5">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) =>
                    setUsername(
                      e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""),
                    )
                  }
                  required
                  minLength={3}
                  maxLength={30}
                  placeholder="e.g. john_parts"
                  autoComplete="username"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="fullName">Full name</Label>
                <Input
                  id="fullName"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  autoComplete="name"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="dob">Date of birth</Label>
                <Input
                  id="dob"
                  type="date"
                  value={dateOfBirth}
                  onChange={(e) => setDateOfBirth(e.target.value)}
                  required
                  max={new Date().toISOString().split("T")[0]}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Profile visibility</Label>
                <div className="flex gap-4 text-sm">
                  {(["public", "private"] as PrivacyMode[]).map((v) => (
                    <label
                      key={v}
                      className="flex items-center gap-1.5 cursor-pointer"
                    >
                      <input
                        type="radio"
                        name="privacyMode"
                        value={v}
                        checked={privacyMode === v}
                        onChange={() => setPrivacyMode(v)}
                      />
                      <span className="capitalize">{v}</span>
                    </label>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  {privacyMode === "public"
                    ? "Your full name is visible to other users."
                    : "Only your username is visible to other users."}
                </p>
              </div>
            </>
          )}

          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "…" : mode === "login" ? "Sign in" : "Create account"}
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            {mode === "login" ? "No account?" : "Already have an account?"}{" "}
            <button
              type="button"
              className="underline"
              onClick={() =>
                switchMode(mode === "login" ? "register" : "login")
              }
            >
              {mode === "login" ? "Register" : "Sign in"}
            </button>
          </p>
        </form>
      </CardContent>
    </Card>
  );
}

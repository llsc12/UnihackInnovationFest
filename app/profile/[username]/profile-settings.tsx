"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import type { OwnProfile, PrivacyMode } from "@/lib/types";

export function ProfileSettings({ profile }: { profile: OwnProfile }) {
  return (
    <div className="space-y-6">
      <EditProfileCard profile={profile} />
      <ChangePasswordCard />
      <DangerZoneCard />
    </div>
  );
}

function EditProfileCard({ profile }: { profile: OwnProfile }) {
  const [username, setUsername] = useState(profile.username);
  const [fullName, setFullName] = useState(profile.fullName);
  const [privacyMode, setPrivacyMode] = useState<PrivacyMode>(profile.privacyMode);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    const res = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, fullName, privacyMode }),
    });
    const body = await res.json().catch(() => ({}));
    setLoading(false);
    if (res.ok) {
      setMessage({ ok: true, text: "Profile updated." });
      // Reload to reflect username change in URL if it changed
      if (username !== profile.username) {
        window.location.href = `/profile/${username}`;
      }
    } else {
      setMessage({ ok: false, text: body.error ?? "Failed to update profile." });
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Edit profile</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
              required
              minLength={3}
              maxLength={30}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="fullName">Full name</Label>
            <Input
              id="fullName"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label>Profile visibility</Label>
            <div className="flex gap-4 text-sm">
              {(["public", "private"] as PrivacyMode[]).map((v) => (
                <label key={v} className="flex items-center gap-1.5 cursor-pointer">
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
          {message && (
            <p className={`text-sm ${message.ok ? "text-emerald-600" : "text-destructive"}`}>
              {message.text}
            </p>
          )}
          <Button type="submit" disabled={loading}>{loading ? "Saving…" : "Save changes"}</Button>
        </form>
      </CardContent>
    </Card>
  );
}

function ChangePasswordCard() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) {
      setMessage({ ok: false, text: "Passwords do not match." });
      return;
    }
    setLoading(true);
    setMessage(null);
    const res = await fetch("/api/auth/change-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    const body = await res.json().catch(() => ({}));
    setLoading(false);
    if (res.ok) {
      setMessage({ ok: true, text: "Password changed successfully." });
      setPassword("");
      setConfirm("");
    } else {
      setMessage({ ok: false, text: body.error ?? "Failed to change password." });
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Change password</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="newPassword">New password</Label>
            <Input
              id="newPassword"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              autoComplete="new-password"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="confirmPassword">Confirm password</Label>
            <Input
              id="confirmPassword"
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
              minLength={6}
              autoComplete="new-password"
            />
          </div>
          {message && (
            <p className={`text-sm ${message.ok ? "text-emerald-600" : "text-destructive"}`}>
              {message.text}
            </p>
          )}
          <Button type="submit" disabled={loading}>{loading ? "Updating…" : "Update password"}</Button>
        </form>
      </CardContent>
    </Card>
  );
}

function DangerZoneCard() {
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onDelete() {
    setLoading(true);
    setError(null);
    const res = await fetch("/api/auth/delete-account", { method: "DELETE" });
    if (res.ok) {
      window.location.href = "/";
    } else {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? "Failed to delete account.");
      setLoading(false);
    }
  }

  return (
    <Card className="border-destructive/50">
      <CardHeader>
        <CardTitle className="text-destructive">Danger zone</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">
          Deleting your account is permanent and cannot be undone. Your listings will remain visible but will no longer be linked to an account.
        </p>
        {error && <p className="text-sm text-destructive">{error}</p>}
        {confirming ? (
          <div className="flex gap-3">
            <Button variant="destructive" onClick={onDelete} disabled={loading}>
              {loading ? "Deleting…" : "Yes, delete my account"}
            </Button>
            <Button variant="outline" onClick={() => setConfirming(false)} disabled={loading}>
              Cancel
            </Button>
          </div>
        ) : (
          <Button variant="destructive" onClick={() => setConfirming(true)}>
            Delete account
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

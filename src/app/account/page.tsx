"use client";

import { FormEvent, useEffect, useState } from "react";
import { AuthDialog } from "@/components/auth-dialog";
import { SecondaryNav } from "@/components/secondary-nav";
import type { SessionUser } from "@/lib/domain";

export default function AccountPage() {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [authOpen, setAuthOpen] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState("");

  useEffect(() => {
    fetch("/api/auth/me").then((response) => response.json()).then((result: { user: SessionUser | null }) => {
      setUser(result.user);
      if (!result.user) setAuthOpen(true);
    }).catch(() => setAuthOpen(true));
  }, []);

  async function updateProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const data = new FormData(event.currentTarget);
    const response = await fetch("/api/auth/me", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: data.get("name"), email: data.get("email") }) });
    const result = await response.json() as { user?: SessionUser; error?: string };
    if (!response.ok || !result.user) setError(result.error ?? "Could not update your profile.");
    else { setUser(result.user); setSaved("Your profile is up to date."); }
  }

  return <><SecondaryNav /><main className="account-page"><p className="eyebrow">Your Roam account</p><h1>Personal details</h1><p className="page-subtitle">Keep the details connected to your stays current.</p>{user && <form className="profile-form" onSubmit={updateProfile}><label>Full name<input name="name" autoComplete="name" minLength={2} maxLength={80} defaultValue={user.name} required /></label><label>Email address<input name="email" type="email" autoComplete="email" defaultValue={user.email} required /></label>{error && <p className="form-error" role="alert">{error}</p>}{saved && <p className="form-success" role="status">{saved}</p>}<button className="button button--dark" type="submit">Save changes</button></form>}</main><AuthDialog open={authOpen} message="Sign in to manage your account." onClose={() => setAuthOpen(false)} onSuccess={(nextUser) => { setUser(nextUser); setAuthOpen(false); }} /></>;
}
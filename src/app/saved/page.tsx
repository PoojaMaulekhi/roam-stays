"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { AuthDialog } from "@/components/auth-dialog";
import { SecondaryNav } from "@/components/secondary-nav";
import { StayCard } from "@/components/stay-card";
import type { Stay } from "@/lib/domain";

export default function SavedPage() {
  const [stays, setStays] = useState<Stay[]>([]);
  const [loading, setLoading] = useState(true);
  const [authOpen, setAuthOpen] = useState(false);

  const loadSaved = useCallback(async () => {
    setLoading(true);
    const response = await fetch("/api/wishlist", { cache: "no-store" });
    if (response.status === 401) {
      setStays([]);
      setAuthOpen(true);
    } else if (response.ok) {
      const result = await response.json() as { stays: Stay[] };
      setStays(result.stays);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadSaved(), 0);
    return () => window.clearTimeout(timer);
  }, [loadSaved]);

  async function unsave(stay: Stay) {
    await fetch("/api/wishlist", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ slug: stay.slug }) });
    setStays((current) => current.filter((item) => item.slug !== stay.slug));
  }

  return <><SecondaryNav /><main className="account-page"><p className="eyebrow">Keep the good ones close</p><h1>Saved stays</h1><p className="page-subtitle">A private little list for the places you want to come back to.</p>{loading ? <p>Loading your list…</p> : stays.length ? <div className="saved-grid">{stays.map((stay) => <StayCard key={stay.slug} stay={stay} saved onSave={unsave} />)}</div> : <div className="page-empty"><h2>Save a place for later.</h2><p>Tap the heart on a stay you like and you’ll find it here.</p><Link className="button button--dark" href="/">Explore stays</Link></div>}</main><AuthDialog open={authOpen} message="Sign in to view saved stays." onClose={() => setAuthOpen(false)} onSuccess={() => { setAuthOpen(false); void loadSaved(); }} /></>;
}
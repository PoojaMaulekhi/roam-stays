"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AuthDialog } from "@/components/auth-dialog";
import { Icon } from "@/components/icon";
import type { SessionUser } from "@/lib/domain";

export function SecondaryNav() {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [authOpen, setAuthOpen] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me").then((response) => response.json()).then((result: { user: SessionUser | null }) => setUser(result.user)).catch(() => undefined);
  }, []);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
  }

  return <>
    <header className="secondary-header">
      <Link className="brand-mark" href="/"><span className="brand-mark__symbol">r.</span><span>roam<span className="brand-mark__sub">stays</span></span></Link>
      <nav className="secondary-header__links" aria-label="Account navigation"><Link href="/#stays">Find a stay</Link><Link href="/#stays">My bookings</Link><Link href="/#stays">Saved stays</Link>{user?.role === "admin" && <Link href="/#stays">Admin portal</Link>}</nav>
      <div className="secondary-header__account">
        {user ? <><span>{user.name.split(" ")[0]}</span><button className="icon-button" type="button" aria-label="Sign out" onClick={logout}><Icon name="user" size={18} /></button></> : <button className="button button--outline" type="button" onClick={() => setAuthOpen(true)}>Sign in</button>}
      </div>
    </header>
    <AuthDialog open={authOpen} onClose={() => setAuthOpen(false)} onSuccess={setUser} />
  </>;
}
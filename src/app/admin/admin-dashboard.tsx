"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/icon";

type AdminData = {
  counts: { users: number; stays: number; bookings: number; pendingPayments: number; reviews: number; revenue: number };
  stays: { slug: string; name: string; location: string; nightlyPrice: number; status: string }[];
  bookings: { id: string; guest: string; email: string; stay: string; checkIn: string; checkOut: string; total: number; status: string }[];
  users: { id: number; name: string; email: string; role: string }[];
  categories: { slug: string; label: string; sortOrder: number }[];
  payments: { id: string; booking_id: string; amount: number; provider: string; status: string; created_at: string }[];
};

const rupees = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 });

export default function AdminDashboard() {
  const [data, setData] = useState<AdminData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [categoryName, setCategoryName] = useState("");
  const [categoryDrafts, setCategoryDrafts] = useState<Record<string, string>>({});
  const [mobileOpen, setMobileOpen] = useState(false);
  const [adminName, setAdminName] = useState("Administrator");
  const router = useRouter();

  const loadAdmin = useCallback(async () => {
    setLoading(true);
    const response = await fetch("/api/admin", { cache: "no-store" });
    const result = await response.json() as AdminData & { error?: string };
    if (response.status === 401 || response.status === 403) {
      router.push("/");
      return;
    }
    if (!response.ok) {
      setError(result.error ?? "Admin access is restricted.");
    } else {
      setError("");
      setData(result);
      setCategoryDrafts(Object.fromEntries(result.categories.map((category) => [category.slug, category.label])));
    }
    setLoading(false);
  }, [router]);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadAdmin(), 0);
    fetch("/api/auth/me").then((response) => response.json()).then((result: { user?: { name: string } }) => {
      if (result.user?.name) setAdminName(result.user.name);
    }).catch(() => undefined);
    return () => window.clearTimeout(timer);
  }, [loadAdmin]);

  async function update(payload: Record<string, string | number>) {
    const response = await fetch("/api/admin", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    const result = await response.json() as { error?: string };
    if (!response.ok) {
      setError(result.error ?? "Update failed.");
    } else {
      await loadAdmin();
    }
  }

  async function addCategory(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const response = await fetch("/api/admin", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ label: categoryName }) });
    const result = await response.json() as { error?: string };
    if (!response.ok) setError(result.error ?? "Couldn’t add category.");
    else {
      setCategoryName("");
      setError("");
      await loadAdmin();
    }
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
  }

  function scrollTo(id: string) {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
    setMobileOpen(false);
  }

  const navItems = [
    ["overview", "Overview"], ["users", "Users"], ["products", "Products"],
    ["orders", "Orders"], ["content", "Content"], ["settings", "Settings"],
  ] as const;

  return <div className="admin-shell">
    <aside className={`admin-sidebar${mobileOpen ? " is-open" : ""}`}>
      <button className="admin-sidebar__brand" type="button" onClick={() => scrollTo("overview")}><span>r.</span><strong>roam<strong className="admin-sidebar__sub">stays</strong></strong></button>
      <nav className="admin-sidebar__nav" aria-label="Admin portal">
        {navItems.map(([id, label]) => <button key={id} type="button" onClick={() => scrollTo(id)}><Icon name={id === "overview" ? "compass" : id === "users" ? "user" : id === "products" ? "cabin" : id === "orders" ? "calendar" : id === "content" ? "sparkles" : "menu"} size={17} /><span>{label}</span></button>)}
      </nav>
      <button className="admin-sidebar__logout" type="button" onClick={logout}>Sign out</button>
    </aside>

    {mobileOpen && <button className="admin-sidebar__backdrop" type="button" aria-label="Close navigation" onClick={() => setMobileOpen(false)} />}

    <main className="admin-main">
      <header className="admin-topbar">
        <button className="admin-mobile-menu" type="button" aria-label="Open navigation" onClick={() => setMobileOpen(true)}><Icon name="menu" size={20} /></button>
        <div><span>Administration</span><strong>Welcome back, {adminName.split(" ")[0]}</strong></div>
        <div className="admin-topbar__profile"><span>{adminName.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase()}</span><div><strong>{adminName}</strong><small>Super Admin</small></div></div>
      </header>

      {error && <p className="admin-alert" role="alert">{error}</p>}
      {loading ? <div className="admin-loading">Loading dashboard…</div> : data && <>
        <section className="admin-content" id="overview">
          <div className="admin-heading"><div><p>PORTAL OVERVIEW</p><h1>Dashboard</h1></div><button type="button" onClick={() => void loadAdmin()}>Refresh data</button></div>
          <div className="admin-metrics">
            <article><span>Registered users</span><strong>{data.counts.users}</strong><small>Customer accounts</small></article>
            <article><span>Total products</span><strong>{data.counts.stays}</strong><small>Available stays</small></article>
            <article><span>Total orders</span><strong>{data.counts.bookings}</strong><small>{data.counts.pendingPayments} pending payment</small></article>
            <article><span>Revenue</span><strong>₹{rupees.format(data.counts.revenue)}</strong><small>Confirmed bookings</small></article>
          </div>

          <div className="admin-overview-grid">
            <section className="admin-panel"><div className="admin-panel__header"><div><p>ACTIVITY</p><h2>Recent orders</h2></div></div>{data.bookings.length ? <div className="admin-recent-list">{data.bookings.slice(0, 5).map((booking) => <div key={booking.id}><span className="admin-avatar">{booking.guest[0]}</span><div><strong>{booking.guest}</strong><small>{booking.stay}</small></div><b>₹{rupees.format(booking.total)}</b><em className={`status status--${booking.status}`}>{booking.status.replace("_", " ")}</em></div>)}</div> : <p className="admin-empty">No recent orders.</p>}</section>
            <section className="admin-panel admin-health"><div className="admin-panel__header"><div><p>SYSTEM</p><h2>Portal health</h2></div></div><div className="admin-health__score"><strong>{data.counts.pendingPayments ? 82 : 96}%</strong><span>Operational</span></div><ul><li><span>Listings</span><b>{data.counts.stays}</b></li><li><span>Reviews</span><b>{data.counts.reviews}</b></li><li><span>Pending payments</span><b>{data.counts.pendingPayments}</b></li></ul></section>
          </div>
        </section>

        <section className="admin-content admin-section" id="users"><div className="admin-heading"><div><p>ACCESS CONTROL</p><h2>User management</h2></div></div><div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>User</th><th>Email</th><th>Role</th><th>Action</th></tr></thead><tbody>{data.users.map((account) => <tr key={account.id}><td><span className="admin-avatar">{account.name[0]}</span>{account.name}</td><td>{account.email}</td><td><span className="admin-role">{account.role}</span></td><td><button type="button" onClick={() => void update({ action: "user-role", id: account.id, role: account.role === "admin" ? "guest" : "admin" })} disabled={false}>{account.role === "admin" ? "Make guest" : "Make admin"}</button></td></tr>)}</tbody></table></div></section>

        <section className="admin-content admin-section" id="products"><div className="admin-heading"><div><p>CATALOG</p><h2>Product management</h2></div></div><div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Property</th><th>Location</th><th>Nightly price</th><th>Status</th><th>Action</th></tr></thead><tbody>{data.stays.map((stay) => <tr key={stay.slug}><td><strong>{stay.name}</strong></td><td>{stay.location}</td><td><input aria-label={`Price for ${stay.name}`} type="number" min="1" defaultValue={stay.nightlyPrice} id={`price-${stay.slug}`} /></td><td><span className={`status status--${stay.status}`}>{stay.status}</span></td><td><button type="button" onClick={() => { const input = document.getElementById(`price-${stay.slug}`) as HTMLInputElement | null; void update({ action: "update-stay", slug: stay.slug, price: Number(input?.value), status: stay.status === "active" ? "paused" : "active" }); }}>{stay.status === "active" ? "Save & pause" : "Save & publish"}</button></td></tr>)}</tbody></table></div></section>

        <section className="admin-content admin-section" id="orders"><div className="admin-heading"><div><p>FULFILMENT</p><h2>Order management</h2></div></div><div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Guest</th><th>Stay</th><th>Dates</th><th>Total</th><th>Status</th><th>Action</th></tr></thead><tbody>{data.bookings.map((booking) => <tr key={booking.id}><td><strong>{booking.guest}</strong><small>{booking.email}</small></td><td>{booking.stay}</td><td>{booking.checkIn} – {booking.checkOut}</td><td>₹{rupees.format(booking.total)}</td><td><span className={`status status--${booking.status}`}>{booking.status.replace("_", " ")}</span></td><td>{booking.status === "pending_payment" ? <button type="button" onClick={() => void update({ action: "booking-status", bookingId: booking.id, status: "confirmed" })}>Confirm</button> : booking.status === "confirmed" ? <button type="button" onClick={() => void update({ action: "booking-status", bookingId: booking.id, status: "cancelled" })}>Cancel</button> : "—"}</td></tr>)}</tbody></table></div></section>

        <section className="admin-content admin-section" id="content"><div className="admin-heading"><div><p>WEBSITE</p><h2>Content management</h2></div></div><div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>URL key</th><th>Label</th><th>Action</th></tr></thead><tbody>{data.categories.map((category) => <tr key={category.slug}><td>{category.slug}</td><td><input aria-label={`Label for ${category.slug}`} value={categoryDrafts[category.slug] ?? category.label} onChange={(event) => setCategoryDrafts((current) => ({ ...current, [category.slug]: event.target.value }))} /></td><td><button type="button" onClick={() => void update({ action: "category-label", slug: category.slug, label: categoryDrafts[category.slug] ?? category.label })}>Save label</button></td></tr>)}</tbody></table></div><form className="admin-add-category" onSubmit={addCategory}><input aria-label="New category label" value={categoryName} onChange={(event) => setCategoryName(event.target.value)} placeholder="New category name" maxLength={60} required /><button type="submit">Add category</button></form></section>

        <section className="admin-content admin-section" id="settings"><div className="admin-heading"><div><p>CONFIGURATION</p><h2>Settings</h2></div></div><div className="admin-settings-grid"><article><h3>Security</h3><p>Admin sessions are verified against the database on every protected request.</p><span>RBAC enabled</span></article><article><h3>Payments</h3><p>Offline and gateway payment records are monitored from this portal.</p><span>{data.counts.pendingPayments} pending</span></article><article><h3>Site access</h3><p>The admin route requires an authenticated account with the admin role.</p><span>Restricted</span></article></div></section>
      </>}
    </main>
  </div>;
}

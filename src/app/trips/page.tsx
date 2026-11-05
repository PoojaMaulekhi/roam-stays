"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AuthDialog } from "@/components/auth-dialog";
import { SecondaryNav } from "@/components/secondary-nav";
import type { Booking } from "@/lib/domain";

const rupees = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 });
const PAGE_SIZE = 6;

function bookingBucket(booking: Booking, today = new Date().toISOString().slice(0, 10)) {
  if (booking.status === "cancelled") return "cancelled";
  if (booking.status === "completed" || (booking.status === "confirmed" && booking.checkOut < today)) return "completed";
  if (booking.status === "confirmed") return "confirmed";
  return "pending";
}

export default function TripsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [authOpen, setAuthOpen] = useState(false);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [sort, setSort] = useState("newest");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Booking | null>(null);

  const loadTrips = useCallback(async () => {
    setLoading(true);
    const response = await fetch("/api/bookings", { cache: "no-store" });
    if (response.status === 401) {
      setAuthOpen(true);
      setBookings([]);
    } else if (response.ok) {
      const result = await response.json() as { bookings: Booking[] };
      setBookings(result.bookings);
      setError("");
    } else setError("Your bookings couldn’t be loaded.");
    setLoading(false);
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadTrips(), 0);
    const interval = window.setInterval(() => void loadTrips(), 30000);
    const refresh = () => void loadTrips();
    window.addEventListener("focus", refresh);
    return () => { window.clearTimeout(timer); window.clearInterval(interval); window.removeEventListener("focus", refresh); };
  }, [loadTrips]);

  async function viewDetails(id: string) {
    const response = await fetch(`/api/bookings/${encodeURIComponent(id)}`, { cache: "no-store" });
    const result = await response.json() as { booking?: Booking; error?: string };
    if (!response.ok) setError(result.error ?? "Couldn’t load booking details."); else setSelected(result.booking ?? null);
  }

  async function cancelBooking(id: string) {
    const response = await fetch(`/api/bookings/${encodeURIComponent(id)}`, { method: "PATCH" });
    const result = await response.json() as { error?: string };
    if (!response.ok) setError(result.error ?? "Couldn’t cancel this booking."); else { setSelected(null); await loadTrips(); }
  }

  const counts = useMemo(() => ({
    total: bookings.length,
    pending: bookings.filter((booking) => bookingBucket(booking) === "pending").length,
    confirmed: bookings.filter((booking) => bookingBucket(booking) === "confirmed").length,
    cancelled: bookings.filter((booking) => bookingBucket(booking) === "cancelled").length,
    completed: bookings.filter((booking) => bookingBucket(booking) === "completed").length,
  }), [bookings]);

  const filtered = useMemo(() => bookings
    .filter((booking) => filter === "all" || bookingBucket(booking) === filter)
    .filter((booking) => booking.id.toLowerCase().includes(query.toLowerCase().trim()))
    .sort((a, b) => sort === "oldest" ? a.checkIn.localeCompare(b.checkIn) : sort === "amount" ? b.total - a.total : b.checkIn.localeCompare(a.checkIn)), [bookings, filter, query, sort]);
  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const visible = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return <><SecondaryNav /><main className="customer-bookings account-page">
    <div className="customer-bookings__heading"><div><p className="eyebrow">MY BOOKINGS</p><h1>Booking history</h1><p className="page-subtitle">All reservations linked to your Roam account.</p></div><Link className="button button--dark" href="/">Book another stay</Link></div>
    {error && <p className="form-error" role="alert">{error}</p>}
    <section className="booking-stats" aria-label="Booking statistics">
      {[["total", "Total bookings", counts.total], ["pending", "Pending", counts.pending], ["confirmed", "Confirmed", counts.confirmed], ["cancelled", "Cancelled", counts.cancelled], ["completed", "Completed", counts.completed]].map(([key, label, value]) => <article key={String(key)} className={`booking-stat booking-stat--${key}`}><span>{label}</span><strong>{value}</strong></article>)}
    </section>
    <section className="booking-manager">
      <div className="booking-toolbar"><label>Search booking ID<input value={query} onChange={(event) => { setQuery(event.target.value); setPage(1); }} placeholder="e.g. RM-12AB34CD" /></label><label>Status<select value={filter} onChange={(event) => { setFilter(event.target.value); setPage(1); }}><option value="all">All statuses</option><option value="pending">Pending</option><option value="confirmed">Confirmed</option><option value="cancelled">Cancelled</option><option value="completed">Completed</option></select></label><label>Sort<select value={sort} onChange={(event) => setSort(event.target.value)}><option value="newest">Date: newest</option><option value="oldest">Date: oldest</option><option value="amount">Highest amount</option></select></label></div>
      {loading ? <p className="booking-loading">Loading your bookings…</p> : visible.length ? <div className="booking-table-wrap"><table className="booking-table"><thead><tr><th>Booking ID</th><th>Stay</th><th>Booking date</th><th>Guest</th><th>Amount</th><th>Payment</th><th>Status</th><th>Review</th><th></th></tr></thead><tbody>{visible.map((booking) => { const status = bookingBucket(booking); return <tr key={booking.id}><td><strong>{booking.id}</strong><small>{booking.createdAt ? new Date(booking.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "Time not recorded"}</small></td><td><div className="booking-stay"><Image src={booking.image} alt="" width={72} height={52} /><span><strong>{booking.stayName}</strong><small>{booking.location}</small></span></div></td><td><strong>{booking.checkIn}</strong><small>to {booking.checkOut}</small></td><td>{booking.customerName ?? "Account holder"}<small>{booking.customerPhone || booking.customerEmail || "Contact not recorded"}</small></td><td>₹{rupees.format(booking.total)}</td><td><span className={`payment-badge payment-badge--${booking.paymentStatus}`}>{booking.paymentStatus}</span></td><td><span className={`booking-badge booking-badge--${status}`}>{status}</span></td><td><span className="booking-review-dummy">Review dummy</span></td><td><button className="button booking-view" type="button" onClick={() => void viewDetails(booking.id)}>View details</button></td></tr>; })}</tbody></table></div> : <div className="page-empty"><h2>{query || filter !== "all" ? "No matching bookings" : "Your next story is out there."}</h2><p>{query || filter !== "all" ? "Try a different booking ID or status." : "When you reserve a stay, you’ll find it here."}</p>{!query && filter === "all" && <Link className="button button--dark" href="/">Find a stay</Link>}</div>}
      {!loading && filtered.length > PAGE_SIZE && <div className="booking-pagination"><button type="button" disabled={page === 1} onClick={() => setPage((value) => value - 1)}>Previous</button><span>Page {page} of {pages}</span><button type="button" disabled={page === pages} onClick={() => setPage((value) => value + 1)}>Next</button></div>}
    </section>
  </main>
  {selected && <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setSelected(null); }}><section className="booking-modal" role="dialog" aria-modal="true" aria-label="Booking details"><div className="booking-modal__header"><div><p>BOOKING {selected.id}</p><h2>{selected.stayName}</h2></div><button type="button" aria-label="Close" onClick={() => setSelected(null)}>×</button></div><div className="booking-modal__body"><Image src={selected.image} alt={selected.stayName} width={720} height={280} /><div className="booking-details-grid"><div><span>Check in</span><strong>{selected.checkIn}</strong></div><div><span>Check out</span><strong>{selected.checkOut}</strong></div><div><span>Guests</span><strong>{selected.guests}</strong></div><div><span>Booking status</span><strong><span className={`booking-badge booking-badge--${bookingBucket(selected)}`}>{bookingBucket(selected)}</span></strong></div><div><span>Payment</span><strong>{selected.paymentStatus}</strong></div><div><span>Amount</span><strong>₹{rupees.format(selected.total)}</strong></div></div><div className="booking-breakdown"><p><span>Nightly × {selected.nights}</span><b>₹{rupees.format(selected.nightlyPrice * selected.nights)}</b></p><p><span>Cleaning fee</span><b>₹{rupees.format(selected.cleaningFee)}</b></p><p><span>Service fee</span><b>₹{rupees.format(selected.serviceFee)}</b></p><p><span>Taxes</span><b>₹{rupees.format(selected.taxes)}</b></p>  </div><div className="booking-review-dummy booking-review-dummy--modal">Review dummy</div><p className="booking-contact"><span>Customer</span><strong>{selected.customerName}</strong><small>{selected.customerPhone || selected.customerEmail || "Contact not recorded"}</small></p></div><div className="booking-modal__footer">{["pending_payment", "confirmed"].includes(selected.status) && <button className="button button--outline" type="button" onClick={() => void cancelBooking(selected.id)}>Cancel booking</button>}<button className="button button--dark" type="button" onClick={() => setSelected(null)}>Close</button></div></section></div>}
  <AuthDialog open={authOpen} message="Sign in to view your bookings." onClose={() => setAuthOpen(false)} onSuccess={() => { setAuthOpen(false); void loadTrips(); }} />
  </>;
}
"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AuthDialog } from "@/components/auth-dialog";
import { Icon } from "@/components/icon";
import { SecondaryNav } from "@/components/secondary-nav";
import type { SessionUser, Stay } from "@/lib/domain";

type Review = { name: string; rating: number; comment: string; createdAt: string };
type StayResult = { stay: Stay; reviews: Review[] };
type BookingResult = { booking?: { id: string; total: number }; error?: string };
const rupees = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 });

export function StayDetail({ slug, initialStay, initialReviews = [] }: { slug: string; initialStay: Stay | null; initialReviews?: Review[] }) {
  const [stay, setStay] = useState<Stay | null>(initialStay);
  const [reviews, setReviews] = useState<Review[]>(initialReviews);
  const [loading, setLoading] = useState(false);
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [guests, setGuests] = useState(2);
  const [authOpen, setAuthOpen] = useState(false);
  const [user, setUser] = useState<SessionUser | null>(null);
  const [authMessage, setAuthMessage] = useState("");
  const [error, setError] = useState("");
  const [bookingId, setBookingId] = useState("");
  const [saved, setSaved] = useState(false);
  const [lens, setLens] = useState<{ index: number; x: number; y: number; xPercent: number; yPercent: number } | null>(null);

  useEffect(() => {
    fetch("/api/auth/me").then((response) => response.json()).then((result: { user: SessionUser | null }) => setUser(result.user)).catch(() => undefined);
  }, [slug]);

  const price = useMemo(() => {
    if (!stay || !checkIn || !checkOut || checkOut <= checkIn) return null;
    const nights = Math.round((Date.parse(`${checkOut}T00:00:00Z`) - Date.parse(`${checkIn}T00:00:00Z`)) / 86400000);
    const base = stay.nightlyPrice * nights;
    const service = Math.round(base * .12);
    const tax = Math.round((base + stay.cleaningFee + service) * .05);
    return { nights, base, service, tax, total: base + stay.cleaningFee + service + tax };
  }, [checkIn, checkOut, stay]);

  useEffect(() => {
    if (stay) document.title = `${stay.name} · ${stay.location} | Roam Stays`;
  }, [stay]);

  async function reserve() {
    if (!stay) return;
    setError("");
    if (!user) {
      setAuthMessage("Sign in to continue with this reservation.");
      setAuthOpen(true);
      return;
    }
    if (!checkIn || !checkOut) {
      setError("Choose your check-in and check-out dates to see the total.");
      return;
    }
    try {
      const response = await fetch("/api/bookings", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ slug, checkIn, checkOut, guests }) });
      const result = await response.json() as BookingResult;
      if (!response.ok || !result.booking) throw new Error(result.error ?? "We couldn’t create this reservation.");
      setBookingId(result.booking.id);
    } catch (reservationError) {
      setError(reservationError instanceof Error ? reservationError.message : "We couldn’t create this reservation.");
    }
  }

  async function shareStay() {
    const shareData = { title: stay?.name ?? "Roam stay", url: window.location.href };
    if (navigator.share) await navigator.share(shareData);
    else {
      await navigator.clipboard.writeText(window.location.href);
      setError("Link copied to clipboard.");
    }
  }

  async function toggleSaved() {
    if (!user) {
      setAuthMessage("Sign in to keep your saved stays together.");
      setAuthOpen(true);
      return;
    }
    const response = await fetch("/api/wishlist", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ slug }) });
    if (response.ok) setSaved((await response.json() as { saved: boolean }).saved);
  }

  if (loading) return <><SecondaryNav /><main className="detail-page"><div className="stay-skeleton"><span /><i /><i /></div></main></>;
  if (!stay) return <><SecondaryNav /><main className="page-empty"><h2>We couldn’t find that stay</h2><p>{error}</p><Link className="button button--dark" href="/#stays">Explore all stays</Link></main></>;

  const mapDelta = .025;
  const mapBox = `${stay.longitude - mapDelta}%2C${stay.latitude - mapDelta}%2C${stay.longitude + mapDelta}%2C${stay.latitude + mapDelta}`;

  return <>
    <SecondaryNav />
    <main className="detail-page">
      <Link className="detail-back" href="/#stays"><Icon name="arrow-left" size={16} /> Back to stays</Link>
      <div className="detail-heading"><div><h1>{stay.name}</h1><p><Icon name="star" size={13} /> {stay.rating.toFixed(2)} · {reviews.length ? `${reviews.length} guest reviews` : "New to Roam"} · {stay.location}</p></div><div className="detail-actions"><button type="button" onClick={shareStay}><Icon name="share" size={15} /> Share</button><button type="button" onClick={toggleSaved}><Icon name="heart" size={15} /> {saved ? "Saved" : "Save"}</button></div></div>
      <div className="detail-gallery" aria-label="Stay photos">
        {stay.images.slice(0, 5).map((photo, index) => (
          <div
            className="detail-gallery__item"
            key={`${photo}-${index}`}
            onPointerMove={(event) => {
              const rect = event.currentTarget.getBoundingClientRect();
              const x = event.clientX - rect.left;
              const y = event.clientY - rect.top;
              setLens({ index, x, y, xPercent: x / rect.width * 100, yPercent: y / rect.height * 100 });
            }}
            onPointerLeave={() => setLens(null)}
          >
            <Image src={photo} alt={`${stay.name}, photo ${index + 1}`} width={1000} height={700} priority={index === 0} />
            {lens?.index === index && (
              <span
                className="detail-gallery__lens"
                style={{
                  left: lens.x,
                  top: lens.y,
                  backgroundImage: `url("${photo}")`,
                  backgroundPosition: `${lens.xPercent}% ${lens.yPercent}%`,
                }}
                aria-hidden="true"
              />
            )}
          </div>
        ))}
      </div>

      <div className="detail-content">
        <div className="detail-copy">
          <div className="detail-host"><strong>Hosted by {stay.hostName}</strong><p>{stay.bedrooms} bedrooms · {stay.beds} beds · {stay.baths} baths · Up to {stay.maxGuests} guests · Host since {stay.hostSince}</p></div>
          <section><h2>A place to settle in</h2><p>{stay.description}</p></section>
          <section><h2>What this place offers</h2><div className="detail-amenities">{stay.amenities.map((amenity) => <span key={amenity}><Icon name={amenity.includes("view") ? "mountain" : amenity === "Pool" ? "pool" : amenity === "Wifi" ? "globe" : "check"} size={17} />{amenity}</span>)}</div></section>
          <section><h2>Where you’ll be</h2><p>{stay.location} · {stay.distance}</p><div className="detail-map"><iframe title={`Map of ${stay.location}`} loading="lazy" src={`https://www.openstreetmap.org/export/embed.html?bbox=${mapBox}&layer=mapnik&marker=${stay.latitude}%2C${stay.longitude}`} /></div><a className="detail-back" href={`https://www.openstreetmap.org/?mlat=${stay.latitude}&mlon=${stay.longitude}#map=13/${stay.latitude}/${stay.longitude}`} target="_blank" rel="noreferrer">Open map <Icon name="chevron-right" size={14} /></a></section>
          <section><h2>Guest reviews</h2>{reviews.length ? <div className="review-list">{reviews.map((review, index) => <article className="review-item" key={`${review.name}-${index}`}><div className="review-stars" aria-label={`${review.rating} out of 5 stars`}>{"★".repeat(review.rating)}</div><strong>{review.name}</strong><p>{review.comment}</p></article>)}</div> : <p>Reviews will appear here after guests complete their stays.</p>}</section>
        </div>

        <aside className="detail-reserve" aria-label="Reserve this stay">
          {bookingId ? <div className="reservation-success"><span className="success-check"><Icon name="check" /></span><p className="eyebrow">Reservation saved</p><h2>One step from away.</h2><p>Your reservation <strong>{bookingId}</strong> is saved as pending payment. A live payment gateway must be configured before this booking can be confirmed.</p><Link className="button button--dark button--full" href="/#stays">View your trip</Link></div> : <>
            <div className="detail-reserve__price"><strong>₹{rupees.format(stay.nightlyPrice)}</strong><span>night</span><span className="detail-reserve__rating"><Icon name="star" size={13} /> {stay.rating.toFixed(2)}</span></div>
            <label>Check in<input type="date" min={new Date().toISOString().slice(0, 10)} value={checkIn} onChange={(event) => { setCheckIn(event.target.value); if (checkOut && event.target.value >= checkOut) setCheckOut(""); }} /></label>
            <label>Check out<input type="date" min={checkIn || new Date().toISOString().slice(0, 10)} value={checkOut} onChange={(event) => setCheckOut(event.target.value)} /></label>
            <label>Guests<select value={guests} onChange={(event) => setGuests(Number(event.target.value))}>{Array.from({ length: stay.maxGuests }, (_, index) => index + 1).map((count) => <option value={count} key={count}>{count} {count === 1 ? "guest" : "guests"}</option>)}</select></label>
            <button className="button button--primary button--full" type="button" onClick={reserve}>Reserve</button>
            <p className="reserve-note">You won’t be charged yet.</p>
            {price && <div className="price-breakdown"><div><span>₹{rupees.format(stay.nightlyPrice)} × {price.nights} nights</span><span>₹{rupees.format(price.base)}</span></div><div><span>Cleaning fee</span><span>₹{rupees.format(stay.cleaningFee)}</span></div><div><span>Roam service fee</span><span>₹{rupees.format(price.service)}</span></div><div><span>Taxes</span><span>₹{rupees.format(price.tax)}</span></div><div><span>Total before payment</span><span>₹{rupees.format(price.total)}</span></div></div>}
          </>}
          {error && <p className="form-error" role="alert">{error}</p>}
        </aside>
      </div>
    </main>
    <AuthDialog open={authOpen} message={authMessage} onClose={() => setAuthOpen(false)} onSuccess={(nextUser) => { setUser(nextUser); setAuthMessage(""); }} />
  </>;
}
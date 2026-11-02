"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useState } from "react";
import type { Stay, SessionUser, StayFilters } from "@/lib/domain";
import { Icon, type IconName } from "@/components/icon";
import { StayCard } from "@/components/stay-card";
import { AuthDialog } from "@/components/auth-dialog";

const categories: { label: string; icon: IconName; value?: string }[] = [
  { label: "Amazing views", icon: "mountain", value: "Amazing views" },
  { label: "Cabins", icon: "cabin", value: "Cabins" },
  { label: "Beachfront", icon: "waves", value: "Beachfront" },
  { label: "Farms", icon: "farm", value: "Farms" },
  { label: "Mountains", icon: "mountain", value: "Mountains" },
  { label: "Pools", icon: "pool", value: "Amazing pools" },
  { label: "A little luxury", icon: "sparkles", value: "Luxury stays" },
  { label: "Trending", icon: "compass", value: "Trending" },
];

const popularPlaces = ["Goa, India", "Udaipur, India", "Chikmagalur, India", "Nainital, India", "Puducherry, India", "Kerala, India"];
const rupees = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 });

function buildQuery(filters: StayFilters, checkIn: string, checkOut: string) {
  const query = new URLSearchParams();
  if (filters.location) query.set("location", filters.location);
  if (filters.category) query.set("category", filters.category);
  if (filters.guests) query.set("guests", String(filters.guests));
  if (filters.minPrice !== undefined) query.set("minPrice", String(filters.minPrice));
  if (filters.maxPrice !== undefined) query.set("maxPrice", String(filters.maxPrice));
  if (filters.minRating) query.set("minRating", String(filters.minRating));
  if (filters.bedrooms) query.set("bedrooms", String(filters.bedrooms));
  if (filters.instantBook) query.set("instantBook", "true");
  filters.amenities?.forEach((amenity) => query.append("amenity", amenity));
  if (filters.sort) query.set("sort", filters.sort);
  if (checkIn) query.set("checkIn", checkIn);
  if (checkOut) query.set("checkOut", checkOut);
  return query.toString();
}

export function RoamApp() {
  const [stays, setStays] = useState<Stay[]>([]);
  const [saved, setSaved] = useState<Set<string>>(new Set());
  const [user, setUser] = useState<SessionUser | null>(null);
  const [authOpen, setAuthOpen] = useState(false);
  const [authMessage, setAuthMessage] = useState("");
  const [toast, setToast] = useState("");
  const [loading, setLoading] = useState(true);
  const [searchOpen, setSearchOpen] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState("");
  const [location, setLocation] = useState("");
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);
  const [minPrice, setMinPrice] = useState(0);
  const [maxPrice, setMaxPrice] = useState(30000);
  const [minRating, setMinRating] = useState(0);
  const [bedrooms, setBedrooms] = useState(0);
  const [instantBook, setInstantBook] = useState(false);
  const [amenities, setAmenities] = useState<string[]>([]);
  const [sort, setSort] = useState<StayFilters["sort"]>("recommended");
  const [resultTitle, setResultTitle] = useState("Thoughtful stays, wherever you’re headed");

  const loadStays = useCallback(async (next?: Partial<StayFilters>) => {
    setLoading(true);
    const filters: StayFilters = {
      location,
      category: activeCategory,
      guests: adults + children,
      minPrice: minPrice || undefined,
      maxPrice: maxPrice < 30000 ? maxPrice : undefined,
      minRating: minRating || undefined,
      bedrooms: bedrooms || undefined,
      instantBook,
      amenities,
      sort,
      ...next,
    };
    try {
      const query = buildQuery(filters, checkIn, checkOut);
      const response = await fetch(`/api/stays${query ? `?${query}` : ""}`, { cache: "no-store" });
      const result = await response.json() as { stays: Stay[] };
      setStays(result.stays ?? []);
    } catch {
      setToast("We couldn’t load stays. Check the local server and try again.");
    } finally {
      setLoading(false);
    }
  }, [activeCategory, adults, amenities, bedrooms, checkIn, checkOut, children, instantBook, location, maxPrice, minPrice, minRating, sort]);

  useEffect(() => {
    void loadStays();
    fetch("/api/auth/me").then((response) => response.json()).then((result: { user: SessionUser | null }) => setUser(result.user)).catch(() => undefined);
  }, [loadStays]);

  useEffect(() => {
    if (!user) {
      setSaved(new Set());
      return;
    }
    fetch("/api/wishlist").then((response) => response.ok ? response.json() : Promise.reject()).then((result: { stays: Stay[] }) => setSaved(new Set(result.stays.map((stay) => stay.slug)))).catch(() => undefined);
  }, [user]);

  useEffect(() => {
    if (!toast) return;
    const timeout = window.setTimeout(() => setToast(""), 3300);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  async function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSearchOpen(false);
    setResultTitle(location ? `Stays around ${location}` : "Thoughtful stays, wherever you’re headed");
    await loadStays({ location, category: activeCategory || undefined, sort });
  }

  async function selectCategory(category: string) {
    const nextCategory = activeCategory === category ? "" : category;
    setActiveCategory(nextCategory);
    setResultTitle(nextCategory || "Thoughtful stays, wherever you’re headed");
    await loadStays({ category: nextCategory || undefined });
  }

  async function saveStay(stay: Stay) {
    if (!user) {
      setAuthMessage("Sign in to keep your saved stays together.");
      setAuthOpen(true);
      return;
    }
    const wasSaved = saved.has(stay.slug);
    setSaved((current) => {
      const next = new Set(current);
      if (wasSaved) next.delete(stay.slug);
      else next.add(stay.slug);
      return next;
    });
    try {
      const response = await fetch("/api/wishlist", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ slug: stay.slug }) });
      if (!response.ok) throw new Error("Could not update saved stays.");
    } catch {
      setSaved((current) => {
        const next = new Set(current);
        if (wasSaved) next.add(stay.slug);
        else next.delete(stay.slug);
        return next;
      });
      setToast("Couldn’t update your saved stays. Please try again.");
    }
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
    setAccountMenuOpen(false);
    setToast("You’re signed out.");
  }

  const dateLabel = checkIn && checkOut
    ? `${new Date(`${checkIn}T00:00:00`).toLocaleDateString("en-IN", { day: "numeric", month: "short" })} – ${new Date(`${checkOut}T00:00:00`).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}`
    : undefined;

  return (
    <main className="marketplace-shell">
      <header className="site-header">
        <div className="header-top">
          <Link className="brand-mark" href="/" aria-label="Roam stays home"><span className="brand-mark__symbol">r.</span><span>roam<span className="brand-mark__sub">stays</span></span></Link>
          <nav className="header-links" aria-label="Main navigation">
            <a className="header-links__active" href="#stays">Find a stay</a>
            <a href="/trips">Your trips</a>
            <a href="/saved">Saved</a>
          </nav>
          <div className="header-actions">
            <a className="host-link" href="/admin">List your place <span>↗</span></a>
            <div className="account-anchor">
              <button className="account-button" type="button" aria-label="Open account menu" aria-expanded={accountMenuOpen} onClick={() => setAccountMenuOpen((open) => !open)}>
                <Icon name="menu" size={18} /><span className="account-avatar"><Icon name="user" size={16} /></span>
              </button>
              {accountMenuOpen && <div className="account-menu" role="menu">
                {user ? <>
                  <p className="account-menu__hello">Hello, {user.name.split(" ")[0]}</p>
                  <Link href="/trips" role="menuitem" onClick={() => setAccountMenuOpen(false)}>Your trips</Link>
                  <Link href="/saved" role="menuitem" onClick={() => setAccountMenuOpen(false)}>Saved stays</Link>
                  {user.role === "admin" && <Link href="/admin" role="menuitem" onClick={() => setAccountMenuOpen(false)}>Manage Roam</Link>}
                  <button type="button" role="menuitem" onClick={logout}>Sign out</button>
                </> : <>
                  <button type="button" className="account-menu__strong" onClick={() => { setAuthMessage(""); setAuthOpen(true); setAccountMenuOpen(false); }}>Sign in or create an account</button>
                  <Link href="/saved" role="menuitem" onClick={() => setAccountMenuOpen(false)}>Saved stays</Link>
                </>}
              </div>}
            </div>
          </div>
        </div>

        <div className="search-wrap">
          <form className={`search-bar${searchOpen ? " search-bar--open" : ""}`} onSubmit={submitSearch}>
            <div className="search-segment search-segment--where">
              <label htmlFor="destination">Where</label>
              <input id="destination" list="popular-places" value={location} onChange={(event) => setLocation(event.target.value)} placeholder="Search destinations" autoComplete="off" />
              <datalist id="popular-places">{popularPlaces.map((place) => <option value={place} key={place} />)}</datalist>
            </div>
            <div className="search-segment search-segment--date">
              <label htmlFor="check-in">Check in</label>
              <input id="check-in" type="date" min={new Date().toISOString().slice(0, 10)} value={checkIn} onChange={(event) => { setCheckIn(event.target.value); if (checkOut && event.target.value >= checkOut) setCheckOut(""); }} />
            </div>
            <div className="search-segment search-segment--date">
              <label htmlFor="check-out">Check out</label>
              <input id="check-out" type="date" min={checkIn || new Date().toISOString().slice(0, 10)} value={checkOut} onChange={(event) => setCheckOut(event.target.value)} />
            </div>
            <div className="search-segment search-segment--guests">
              <label htmlFor="guest-count">Who</label>
              <select id="guest-count" value={adults + children} onChange={(event) => setAdults(Math.max(1, Number(event.target.value) - children))}>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((guest) => <option value={guest} key={guest}>{guest} {guest === 1 ? "guest" : "guests"}</option>)}
              </select>
            </div>
            <button className="search-submit" type="submit" aria-label="Search stays"><Icon name="search" size={19} /><span>Search</span></button>
            <button className="search-mobile-toggle" type="button" onClick={() => setSearchOpen((open) => !open)} aria-label="Toggle search fields"><Icon name={searchOpen ? "close" : "search"} size={19} /></button>
          </form>
        </div>
      </header>

      <div className="category-bar-wrap">
        <nav className="category-bar" aria-label="Stay categories">
          <button className={`category-item${activeCategory === "" ? " is-active" : ""}`} type="button" onClick={() => void selectCategory("")}><Icon name="globe" size={22} /><span>All stays</span></button>
          {categories.map((category) => <button className={`category-item${activeCategory === category.value ? " is-active" : ""}`} type="button" key={category.label} onClick={() => void selectCategory(category.value ?? category.label)}><Icon name={category.icon} size={22} /><span>{category.label}</span></button>)}
        </nav>
        <button className="filter-trigger" type="button" onClick={() => setFiltersOpen(true)}><Icon name="filter" size={17} /> Filters {(minPrice || minRating || bedrooms || instantBook || amenities.length) ? <span className="filter-count">{Number(Boolean(minPrice || minRating || bedrooms || instantBook)) + amenities.length}</span> : null}</button>
      </div>

      <section className="intro-row" id="stays">
        <div><p className="eyebrow">Somewhere good begins here</p><h1>{resultTitle}</h1></div>
        <div className="sort-control"><label htmlFor="sort-stays">Sort</label><select id="sort-stays" value={sort} onChange={(event) => { const value = event.target.value as StayFilters["sort"]; setSort(value); void loadStays({ sort: value }); }}><option value="recommended">Recommended</option><option value="price-low">Price: low to high</option><option value="price-high">Price: high to low</option><option value="rating">Top rated</option></select></div>
      </section>

      <div className="results-meta"><span>{loading ? "Finding places" : `${stays.length} ${stays.length === 1 ? "stay" : "stays"} to explore`}</span>{dateLabel && <span><Icon name="calendar" size={14} /> {dateLabel}</span>}{(adults + children) > 0 && <span>{adults + children} guests</span>}</div>

      <section className="stay-grid" aria-live="polite" aria-label="Available stays">
        {loading ? Array.from({ length: 8 }, (_, index) => <div className="stay-skeleton" key={index}><span /><i /><i /><i /></div>) : stays.length ? stays.map((stay) => <StayCard key={stay.slug} stay={stay} saved={saved.has(stay.slug)} onSave={saveStay} dates={dateLabel} />) : <div className="empty-results"><span className="empty-results__mark"><Icon name="compass" size={28} /></span><h2>No stays found just yet</h2><p>Try a nearby destination or open up the filters to see more places.</p><button className="button button--outline" type="button" onClick={() => { setLocation(""); setActiveCategory(""); setMinPrice(0); setMaxPrice(30000); setMinRating(0); setBedrooms(0); setInstantBook(false); setAmenities([]); void loadStays({ location: undefined, category: undefined, minPrice: undefined, maxPrice: undefined, minRating: undefined, bedrooms: undefined, instantBook: false, amenities: [] }); }}>Clear your search</button></div>}
      </section>

      <footer className="site-footer"><div className="footer-note"><span className="brand-mark__symbol">r.</span><span>Considered places. Better getaways.</span></div><div className="footer-links"><a href="#about">About Roam</a><a href="#help">Help centre</a><a href="#terms">Terms</a><a href="#privacy">Privacy</a></div><span className="footer-copyright">© 2026 Roam Stays · India</span></footer>

      {filtersOpen && <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setFiltersOpen(false); }}><section className="filter-dialog" role="dialog" aria-modal="true" aria-labelledby="filter-title">
        <div className="filter-dialog__header"><button className="icon-button" type="button" onClick={() => setFiltersOpen(false)} aria-label="Close filters"><Icon name="close" /></button><h2 id="filter-title">Filters</h2><button className="filter-reset" type="button" onClick={() => { setMinPrice(0); setMaxPrice(30000); setMinRating(0); setBedrooms(0); setInstantBook(false); setAmenities([]); }}>Clear all</button></div>
        <div className="filter-dialog__body">
          <section className="filter-section"><h3>Price range</h3><p className="filter-hint">Nightly prices, before taxes</p><div className="range-labels"><span>₹{rupees.format(minPrice)}</span><span>₹{rupees.format(maxPrice)}</span></div><input aria-label="Minimum nightly price" type="range" min="0" max="30000" step="500" value={minPrice} onChange={(event) => setMinPrice(Math.min(Number(event.target.value), maxPrice))} /><input aria-label="Maximum nightly price" type="range" min="0" max="30000" step="500" value={maxPrice} onChange={(event) => setMaxPrice(Math.max(Number(event.target.value), minPrice))} /></section>
          <section className="filter-section"><h3>Rooms and beds</h3><div className="filter-stepper"><span>Bedrooms</span><div><button type="button" aria-label="Fewer bedrooms" disabled={!bedrooms} onClick={() => setBedrooms((count) => Math.max(0, count - 1))}><Icon name="minus" size={15} /></button><strong>{bedrooms || "Any"}</strong><button type="button" aria-label="More bedrooms" onClick={() => setBedrooms((count) => Math.min(8, count + 1))}><Icon name="plus" size={15} /></button></div></div></section>
          <section className="filter-section"><h3>Guest rating</h3><div className="rating-choices">{[0, 4.5, 4.8, 4.9].map((rating) => <button type="button" className={minRating === rating ? "is-selected" : ""} onClick={() => setMinRating(rating)} key={rating}>{rating === 0 ? "Any" : `${rating}+`} {rating > 0 && <Icon name="star" size={12} />}</button>)}</div></section>
          <section className="filter-section"><h3>Book with confidence</h3><label className="toggle-row"><span><strong>Instant book</strong><small>Confirm a stay without waiting for approval</small></span><input type="checkbox" checked={instantBook} onChange={(event) => setInstantBook(event.target.checked)} /><i /></label></section>
          <section className="filter-section"><h3>Essentials</h3><div className="amenity-choices">{["Wifi", "Kitchen", "Pool", "Free parking", "Workspace", "Breakfast"].map((amenity) => <label key={amenity}><input type="checkbox" checked={amenities.includes(amenity)} onChange={(event) => setAmenities((current) => event.target.checked ? [...current, amenity] : current.filter((value) => value !== amenity))} /><span>{amenity}</span></label>)}</div></section>
        </div>
        <div className="filter-dialog__footer"><span>{stays.length} places</span><button className="button button--dark" type="button" onClick={() => { setFiltersOpen(false); void loadStays({ minPrice: minPrice || undefined, maxPrice: maxPrice < 30000 ? maxPrice : undefined, minRating: minRating || undefined, bedrooms: bedrooms || undefined, instantBook, amenities }); }}>Show stays</button></div>
      </section></div>}

      <AuthDialog open={authOpen} message={authMessage} onClose={() => setAuthOpen(false)} onSuccess={(nextUser) => { setUser(nextUser); setAuthMessage(""); setToast(`Welcome, ${nextUser.name.split(" ")[0]}.`); }} />
      {toast && <div className="toast-message" role="status">{toast}</div>}
    </main>
  );
}
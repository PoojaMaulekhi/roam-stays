import { randomBytes } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { db, getStay } from "@/lib/db";
import { currentUser } from "@/lib/session";

function validDate(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(`${value}T00:00:00Z`));
}

export async function GET(request: NextRequest) {
  const user = currentUser(request);
  if (!user) return NextResponse.json({ error: "Sign in to view your trips." }, { status: 401 });

  const bookings = db.prepare(`
    SELECT bookings.id, bookings.property_slug AS staySlug, properties.name AS stayName,
      properties.location, properties.images, bookings.check_in AS checkIn,
      bookings.check_out AS checkOut, bookings.guests, bookings.nights,
      bookings.nightly_price AS nightlyPrice, bookings.cleaning_fee AS cleaningFee,
      bookings.service_fee AS serviceFee, bookings.taxes, bookings.total, bookings.status,
      bookings.created_at AS createdAt, users.name AS customerName, users.email AS customerEmail,
      users.phone AS customerPhone,
      (SELECT payments.status FROM payments WHERE payments.booking_id = bookings.id ORDER BY payments.created_at DESC LIMIT 1) AS paymentStatus
    FROM bookings
    JOIN properties ON properties.slug = bookings.property_slug
    JOIN users ON users.id = bookings.user_id
    WHERE bookings.user_id = ? ORDER BY bookings.created_at DESC
  `).all(user.id).map((booking) => {
    const rawPaymentStatus = String(booking.paymentStatus ?? "").toLowerCase();
    const paymentStatus: "paid" | "pending" | "refunded" = rawPaymentStatus === "refunded"
      ? "refunded"
      : rawPaymentStatus === "paid" || rawPaymentStatus === "succeeded" || String(booking.status) === "confirmed"
        ? "paid"
        : "pending";
    return {
      ...booking,
      paymentStatus,
      image: (JSON.parse(String(booking.images)) as string[])[0],
      images: undefined,
    };
  });

  return NextResponse.json({ bookings });
}

export async function POST(request: NextRequest) {
  const user = currentUser(request);
  if (!user) return NextResponse.json({ error: "Sign in to reserve this stay." }, { status: 401 });

  const body = await request.json() as { slug?: string; checkIn?: string; checkOut?: string; guests?: number };
  const checkIn = body.checkIn ?? "";
  const checkOut = body.checkOut ?? "";
  const guests = Number(body.guests);
  const stay = body.slug ? getStay(body.slug) : null;

  if (!stay || !validDate(checkIn) || !validDate(checkOut) || checkOut <= checkIn) {
    return NextResponse.json({ error: "Choose a valid stay and date range." }, { status: 400 });
  }

  const nights = Math.round((Date.parse(`${checkOut}T00:00:00Z`) - Date.parse(`${checkIn}T00:00:00Z`)) / 86400000);
  if (nights < 1 || nights > 30 || guests < 1 || guests > stay.maxGuests || !Number.isInteger(guests)) {
    return NextResponse.json({ error: `Choose 1–30 nights and 1–${stay.maxGuests} guests.` }, { status: 400 });
  }

  const today = new Date().toISOString().slice(0, 10);
  if (checkIn < today) return NextResponse.json({ error: "Check-in must be today or later." }, { status: 400 });

  const serviceFee = Math.round(stay.nightlyPrice * nights * 0.12);
  const taxes = Math.round((stay.nightlyPrice * nights + stay.cleaningFee + serviceFee) * 0.05);
  const total = stay.nightlyPrice * nights + stay.cleaningFee + serviceFee + taxes;
  const bookingId = `RM-${randomBytes(4).toString("hex").toUpperCase()}`;

  try {
    db.exec("BEGIN IMMEDIATE");
    const conflict = db.prepare(`
      SELECT id FROM bookings
      WHERE property_slug = ? AND status IN ('pending_payment', 'confirmed')
        AND check_in < ? AND check_out > ? LIMIT 1
    `).get(stay.slug, checkOut, checkIn);

    if (conflict) {
      db.exec("ROLLBACK");
      return NextResponse.json({ error: "Those dates were just reserved. Please choose another range." }, { status: 409 });
    }

    db.prepare(`
      INSERT INTO bookings (
        id, user_id, property_slug, check_in, check_out, guests, nights,
        nightly_price, cleaning_fee, service_fee, taxes, total, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending_payment')
    `).run(bookingId, user.id, stay.slug, checkIn, checkOut, guests, nights, stay.nightlyPrice, stay.cleaningFee, serviceFee, taxes, total);
    db.exec("COMMIT");
  } catch {
    try { db.exec("ROLLBACK"); } catch { /* transaction may already have rolled back */ }
    return NextResponse.json({ error: "Could not reserve this stay. Please retry." }, { status: 500 });
  }

  return NextResponse.json({ booking: { id: bookingId, staySlug: stay.slug, stayName: stay.name, location: stay.location, image: stay.images[0], checkIn, checkOut, guests, nights, nightlyPrice: stay.nightlyPrice, cleaningFee: stay.cleaningFee, serviceFee, taxes, total, status: "pending_payment" } }, { status: 201 });
}
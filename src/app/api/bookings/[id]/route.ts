import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { currentUser, isSameOriginMutation } from "@/lib/session";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = currentUser(request);
  if (!user) return NextResponse.json({ error: "Sign in to view booking details." }, { status: 401 });
  const { id } = await params;
  const booking = db.prepare(`
    SELECT bookings.id, bookings.property_slug AS staySlug, properties.name AS stayName,
      properties.location, properties.images, bookings.check_in AS checkIn,
      bookings.check_out AS checkOut, bookings.guests, bookings.nights,
      bookings.nightly_price AS nightlyPrice, bookings.cleaning_fee AS cleaningFee,
      bookings.service_fee AS serviceFee, bookings.taxes, bookings.total, bookings.status,
      bookings.created_at AS createdAt, users.name AS customerName, users.email AS customerEmail,
      users.phone AS customerPhone,
      (SELECT payments.status FROM payments WHERE payments.booking_id = bookings.id ORDER BY payments.created_at DESC LIMIT 1) AS paymentStatus
    FROM bookings JOIN properties ON properties.slug = bookings.property_slug JOIN users ON users.id = bookings.user_id
    WHERE bookings.id = ? AND bookings.user_id = ?
  `).get(id, user.id);
  if (!booking) return NextResponse.json({ error: "Booking not found." }, { status: 404 });

  const rawPaymentStatus = String(booking.paymentStatus ?? "").toLowerCase();
  const paymentStatus = rawPaymentStatus === "refunded" ? "refunded"
    : rawPaymentStatus === "paid" || rawPaymentStatus === "succeeded" || String(booking.status) === "confirmed" ? "paid" : "pending";
  return NextResponse.json({ booking: {
    ...booking,
    paymentStatus,
    image: (JSON.parse(String(booking.images)) as string[])[0],
    images: undefined,
  } });
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!isSameOriginMutation(request)) return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
  const user = currentUser(request);
  if (!user) return NextResponse.json({ error: "Sign in to manage trips." }, { status: 401 });
  const { id } = await params;
  const booking = db.prepare("SELECT id, status FROM bookings WHERE id = ? AND user_id = ?").get(id, user.id);
  if (!booking) return NextResponse.json({ error: "Booking not found." }, { status: 404 });
  if (booking.status !== "pending_payment" && booking.status !== "confirmed") {
    return NextResponse.json({ error: "This reservation can no longer be cancelled." }, { status: 409 });
  }
  db.prepare("UPDATE bookings SET status = 'cancelled' WHERE id = ?").run(id);
  return NextResponse.json({ ok: true, status: "cancelled" });
}
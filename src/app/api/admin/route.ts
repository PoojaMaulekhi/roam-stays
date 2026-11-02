import { NextRequest, NextResponse } from "next/server";
import { db, getStays } from "@/lib/db";
import { currentUser } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const user = currentUser(request);
  if (user?.role !== "admin") return NextResponse.json({ error: "Admin access required." }, { status: 403 });

  return NextResponse.json({
    counts: {
      users: Number(db.prepare("SELECT COUNT(*) AS count FROM users").get()?.count ?? 0),
      stays: Number(db.prepare("SELECT COUNT(*) AS count FROM properties").get()?.count ?? 0),
      bookings: Number(db.prepare("SELECT COUNT(*) AS count FROM bookings").get()?.count ?? 0),
      pendingPayments: Number(db.prepare("SELECT COUNT(*) AS count FROM bookings WHERE status = 'pending_payment'").get()?.count ?? 0),
      reviews: Number(db.prepare("SELECT COUNT(*) AS count FROM reviews").get()?.count ?? 0),
    },
    stays: getStays({ sort: "recommended" }),
    bookings: db.prepare(`
      SELECT bookings.id, users.name AS guest, users.email, properties.name AS stay,
        bookings.check_in AS checkIn, bookings.check_out AS checkOut,
        bookings.total, bookings.status, bookings.created_at AS createdAt
      FROM bookings JOIN users ON users.id = bookings.user_id
      JOIN properties ON properties.slug = bookings.property_slug
      ORDER BY bookings.created_at DESC LIMIT 50
    `).all(),
    payments: db.prepare("SELECT * FROM payments ORDER BY created_at DESC LIMIT 50").all(),
    users: db.prepare("SELECT id, name, email, role, created_at AS createdAt FROM users ORDER BY created_at DESC LIMIT 50").all(),
  });
}

export async function PATCH(request: NextRequest) {
  const user = currentUser(request);
  if (user?.role !== "admin") return NextResponse.json({ error: "Admin access required." }, { status: 403 });
  const body = await request.json() as { action?: string; slug?: string; price?: number; status?: string; id?: number; role?: string };

  if (body.action === "update-stay" && body.slug && Number.isInteger(body.price) && Number(body.price) > 0) {
    db.prepare("UPDATE properties SET nightly_price = ? WHERE slug = ?").run(body.price, body.slug);
    return NextResponse.json({ ok: true });
  }

  if (body.action === "booking-status" && body.id && ["confirmed", "cancelled"].includes(body.status ?? "")) {
    db.prepare("UPDATE bookings SET status = ? WHERE id = ?").run(body.status, body.id);
    return NextResponse.json({ ok: true });
  }

  if (body.action === "user-role" && body.id && ["guest", "admin"].includes(body.role ?? "")) {
    db.prepare("UPDATE users SET role = ? WHERE id = ?").run(body.role, body.id);
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Unsupported admin update." }, { status: 400 });
}
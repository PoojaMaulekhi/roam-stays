import { NextRequest, NextResponse } from "next/server";
import { db, getAdminStays } from "@/lib/db";
import { currentUser, isSameOriginMutation } from "@/lib/session";

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
      revenue: Number(db.prepare("SELECT COALESCE(SUM(total), 0) AS total FROM bookings WHERE status IN ('confirmed', 'completed')").get()?.total ?? 0),
    },
    stays: getAdminStays(),
    categories: db.prepare("SELECT slug, label, sort_order AS sortOrder FROM categories ORDER BY sort_order").all(),
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
  if (!isSameOriginMutation(request)) return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
  const user = currentUser(request);
  if (user?.role !== "admin") return NextResponse.json({ error: "Admin access required." }, { status: 403 });
  const body = await request.json() as { action?: string; slug?: string; price?: number; status?: string; bookingId?: string; id?: number; role?: string; label?: string };

  if (body.action === "update-stay" && body.slug) {
    if (body.price !== undefined && Number.isInteger(body.price) && body.price > 0) {
      db.prepare("UPDATE properties SET nightly_price = ? WHERE slug = ?").run(body.price, body.slug);
    }
    if (body.status && ["active", "paused"].includes(body.status)) {
      db.prepare("UPDATE properties SET status = ? WHERE slug = ?").run(body.status, body.slug);
    }
    return NextResponse.json({ ok: true });
  }

  if (body.action === "booking-status" && body.bookingId && body.status && ["confirmed", "cancelled"].includes(body.status)) {
    db.prepare("UPDATE bookings SET status = ? WHERE id = ?").run(body.status, body.bookingId);
    return NextResponse.json({ ok: true });
  }

  if (body.action === "user-role" && body.id && body.role && ["guest", "admin"].includes(body.role)) {
    if (body.id === user.id) return NextResponse.json({ error: "You cannot change your own role." }, { status: 400 });
    db.prepare("UPDATE users SET role = ? WHERE id = ?").run(body.role, body.id);
    return NextResponse.json({ ok: true });
  }

  if (body.action === "category-label" && body.slug && body.label?.trim()) {
    db.prepare("UPDATE categories SET label = ? WHERE slug = ?").run(body.label.trim().slice(0, 60), body.slug);
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Unsupported admin update." }, { status: 400 });
}

export async function POST(request: NextRequest) {
  if (!isSameOriginMutation(request)) return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
  const user = currentUser(request);
  if (user?.role !== "admin") return NextResponse.json({ error: "Admin access required." }, { status: 403 });
  const body = await request.json() as { label?: string; slug?: string };
  const label = body.label?.trim().slice(0, 60) ?? "";
  const slug = (body.slug ?? label).trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  if (!label || !slug) return NextResponse.json({ error: "Enter a category name." }, { status: 400 });
  try {
    const sortOrder = Number(db.prepare("SELECT COALESCE(MAX(sort_order), -1) + 1 AS next FROM categories").get()?.next ?? 0);
    db.prepare("INSERT INTO categories (slug, label, sort_order) VALUES (?, ?, ?)").run(slug, label, sortOrder);
    return NextResponse.json({ slug, label }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "A category with that name already exists." }, { status: 409 });
  }
}
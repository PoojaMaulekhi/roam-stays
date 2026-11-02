import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { currentUser } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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
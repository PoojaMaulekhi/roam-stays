import { NextRequest, NextResponse } from "next/server";
import { getStay, getWishlist, toggleWishlist } from "@/lib/db";
import { currentUser } from "@/lib/session";

export async function GET(request: NextRequest) {
  const user = currentUser(request);
  if (!user) return NextResponse.json({ error: "Sign in to see saved stays." }, { status: 401 });
  return NextResponse.json({ stays: getWishlist(user.id) });
}

export async function POST(request: NextRequest) {
  const user = currentUser(request);
  if (!user) return NextResponse.json({ error: "Sign in to save stays." }, { status: 401 });
  const body = await request.json() as { slug?: string };
  if (!body.slug || !getStay(body.slug)) return NextResponse.json({ error: "Stay not found." }, { status: 404 });
  return NextResponse.json({ saved: toggleWishlist(user.id, body.slug) });
}
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isSameOriginMutation } from "@/lib/session";
import { currentUser } from "@/lib/session";

export async function GET(request: NextRequest) {
  return NextResponse.json({ user: currentUser(request) });
}

export async function PATCH(request: NextRequest) {
  if (!isSameOriginMutation(request)) return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
  const user = currentUser(request);
  if (!user) return NextResponse.json({ error: "Sign in to update your profile." }, { status: 401 });
  const body = await request.json() as { name?: string; email?: string };
  const name = body.name?.trim().slice(0, 80) ?? "";
  const email = body.email?.trim().toLowerCase() ?? "";
  if (name.length < 2 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Enter a valid name and email address." }, { status: 400 });
  }

  try {
    db.prepare("UPDATE users SET name = ?, email = ? WHERE id = ?").run(name, email, user.id);
    const updatedUser = { ...user, name, email };
    const { createSessionToken, sessionCookie } = await import("@/lib/session");
    const response = NextResponse.json({ user: updatedUser });
    response.headers.set("Set-Cookie", sessionCookie(createSessionToken(updatedUser), process.env.NODE_ENV === "production"));
    return response;
  } catch {
    return NextResponse.json({ error: "That email address is already in use." }, { status: 409 });
  }
}
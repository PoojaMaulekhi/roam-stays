import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import type { SessionUser } from "@/lib/domain";
import { createSessionToken, isValidEmail, sessionCookie, verifyPassword } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const body = await request.json() as { email?: string; password?: string };
  const email = body.email?.trim().toLowerCase() ?? "";
  const password = body.password ?? "";

  if (!isValidEmail(email) || password.length > 200) {
    return NextResponse.json({ error: "Email or password is incorrect." }, { status: 401 });
  }

  const record = db.prepare("SELECT id, name, email, password_hash AS passwordHash, role FROM users WHERE email = ?").get(email);
  if (!record || !verifyPassword(password, String(record.passwordHash))) {
    return NextResponse.json({ error: "Email or password is incorrect." }, { status: 401 });
  }

  const user: SessionUser = {
    id: Number(record.id),
    name: String(record.name),
    email: String(record.email),
    role: record.role === "admin" ? "admin" : "guest",
  };
  const response = NextResponse.json({ user });
  response.headers.set("Set-Cookie", sessionCookie(createSessionToken(user), process.env.NODE_ENV === "production"));
  return response;
}
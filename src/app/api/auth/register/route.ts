import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import type { SessionUser } from "@/lib/domain";
import { configuredAdmins, createPasswordHash, createSessionToken, isValidEmail, sessionCookie } from "@/lib/session";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as { name?: string; email?: string; password?: string };
    const name = body.name?.trim().slice(0, 80) ?? "";
    const email = body.email?.trim().toLowerCase() ?? "";
    const password = body.password ?? "";

    if (name.length < 2 || !isValidEmail(email) || password.length < 10 || password.length > 200) {
      return NextResponse.json({ error: "Enter a name, valid email and password of at least 10 characters." }, { status: 400 });
    }

    const role = configuredAdmins().includes(email) ? "admin" : "guest";
    const result = db.prepare("INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)").run(
      name,
      email,
      createPasswordHash(password),
      role,
    );
    const user: SessionUser = { id: Number(result.lastInsertRowid), name, email, role };
    const response = NextResponse.json({ user }, { status: 201 });
    response.headers.set("Set-Cookie", sessionCookie(createSessionToken(user), process.env.NODE_ENV === "production"));
    return response;
  } catch (error) {
    if (error instanceof Error && error.message.includes("UNIQUE constraint failed")) {
      return NextResponse.json({ error: "An account with that email already exists." }, { status: 409 });
    }

    return NextResponse.json({ error: "Could not create your account." }, { status: 500 });
  }
}
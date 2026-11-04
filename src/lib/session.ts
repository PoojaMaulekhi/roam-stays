import { createHmac, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import type { NextRequest } from "next/server";
import type { SessionUser } from "@/lib/domain";
import { db } from "@/lib/db";

const cookieName = "roam_session";
const sessionLifetime = 60 * 60 * 24 * 10;

function sessionSecret() {
  const secret = process.env.SESSION_SECRET;
  if (secret?.trim()) {
    if (process.env.NODE_ENV === "production" && secret.length < 32) throw new Error("SESSION_SECRET must be at least 32 characters in production.");
    return secret;
  }
  if (process.env.NODE_ENV === "production") throw new Error("SESSION_SECRET is required in production.");
  return "local-development-secret-change-before-deploy";
}

function sign(payload: string) {
  return createHmac("sha256", sessionSecret()).update(payload).digest("base64url");
}

export function createPasswordHash(password: string) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string) {
  const [salt, expectedHex] = stored.split(":");
  if (!salt || !expectedHex) return false;

  const actual = scryptSync(password, salt, 64);
  const expected = Buffer.from(expectedHex, "hex");
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

export function createSessionToken(user: SessionUser) {
  const payload = Buffer.from(JSON.stringify({ ...user, expiresAt: Date.now() + sessionLifetime * 1000 })).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

export function readSessionToken(token: string | undefined): SessionUser | null {
  if (!token) return null;

  const [payload, signature] = token.split(".");
  if (!payload || !signature) return null;

  const expected = Buffer.from(sign(payload));
  const actual = Buffer.from(signature);
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) return null;

  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as SessionUser & { expiresAt: number };
    if (data.expiresAt < Date.now() || !data.id || !data.email) return null;
    return { id: data.id, name: data.name, email: data.email, role: data.role };
  } catch {
    return null;
  }
}

export function currentUser(request: NextRequest) {
  const tokenUser = readSessionToken(request.cookies.get(cookieName)?.value);
  if (!tokenUser) return null;

  const record = db.prepare("SELECT id, name, email, role FROM users WHERE id = ?").get(tokenUser.id);
  if (!record) return null;

  return {
    id: Number(record.id),
    name: String(record.name),
    email: String(record.email),
    role: record.role === "admin" ? "admin" as const : "guest" as const,
  } satisfies SessionUser;
}

export function isSameOriginMutation(request: NextRequest) {
  const origin = request.headers.get("origin")?.trim();
  const fetchSite = request.headers.get("sec-fetch-site")?.toLowerCase();

  if (fetchSite && fetchSite !== "same-origin") return false;
  if (!origin) return fetchSite === "same-origin";

  try {
    return new URL(origin).host === request.headers.get("host") || new URL(origin).host === request.nextUrl.host;
  } catch {
    return false;
  }
}

export function sessionCookie(token: string, secure: boolean) {
  return `${cookieName}=${token}; HttpOnly; Path=/; SameSite=Lax; Max-Age=${sessionLifetime}${secure ? "; Secure" : ""}`;
}

export function clearSessionCookie(secure: boolean) {
  return `${cookieName}=; HttpOnly; Path=/; SameSite=Lax; Max-Age=0${secure ? "; Secure" : ""}`;
}

export function configuredAdmins() {
  return (process.env.ADMIN_EMAILS ?? "").split(",").map((email) => email.trim().toLowerCase()).filter(Boolean);
}

export function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
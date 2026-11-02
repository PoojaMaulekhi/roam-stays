import { createHmac, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import type { NextRequest } from "next/server";
import type { SessionUser } from "@/lib/domain";

const cookieName = "roam_session";
const sessionLifetime = 60 * 60 * 24 * 10;

function sessionSecret() {
  return process.env.SESSION_SECRET ?? "local-development-secret-change-before-deploy";
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
  return readSessionToken(request.cookies.get(cookieName)?.value);
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
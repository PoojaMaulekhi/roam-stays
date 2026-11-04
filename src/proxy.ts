import { NextRequest, NextResponse } from "next/server";
import { readSessionToken } from "@/lib/session";

export function proxy(request: NextRequest) {
  const user = readSessionToken(request.cookies.get("roam_session")?.value);

  if (!user) {
    const loginUrl = new URL("/?signin=1", request.url);
    return NextResponse.redirect(loginUrl);
  }

  if (request.nextUrl.pathname.startsWith("/admin") && user.role !== "admin") {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin", "/admin/:path*", "/my-bookings", "/my-bookings/:path*"],
};

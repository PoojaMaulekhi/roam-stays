import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@/lib/session";

export async function GET(request: NextRequest) {
  return NextResponse.json({ user: currentUser(request) });
}
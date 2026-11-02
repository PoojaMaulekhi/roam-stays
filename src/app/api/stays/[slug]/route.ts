import { NextResponse } from "next/server";
import { getStay, getStayReviews } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const stay = getStay(slug);
  if (!stay) return NextResponse.json({ error: "Stay not found." }, { status: 404 });
  return NextResponse.json({ stay, reviews: getStayReviews(slug) });
}
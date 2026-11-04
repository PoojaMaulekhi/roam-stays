import { NextResponse } from "next/server";
import { getStay, getStayReviews } from "@/lib/db";

export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const stay = getStay(slug);
  if (!stay) return NextResponse.json({ error: "Stay not found." }, { status: 404 });
  return NextResponse.json({ stay, reviews: getStayReviews(slug) });
}
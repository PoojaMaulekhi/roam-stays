import { NextRequest, NextResponse } from "next/server";
import { getCategories, getStays } from "@/lib/db";
import type { StayFilters } from "@/lib/domain";

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const sort = params.get("sort");
  const filters: StayFilters = {
    location: params.get("location") || undefined,
    category: params.get("category") || undefined,
    checkIn: params.get("checkIn") || undefined,
    checkOut: params.get("checkOut") || undefined,
    guests: Number(params.get("guests")) || undefined,
    minPrice: params.has("minPrice") ? Number(params.get("minPrice")) : undefined,
    maxPrice: params.has("maxPrice") ? Number(params.get("maxPrice")) : undefined,
    minRating: params.has("minRating") ? Number(params.get("minRating")) : undefined,
    bedrooms: Number(params.get("bedrooms")) || undefined,
    instantBook: params.get("instantBook") === "true",
    amenities: params.getAll("amenity"),
    sort: sort === "price-low" || sort === "price-high" || sort === "rating" ? sort : "recommended",
  };

  return NextResponse.json({ stays: getStays(filters), categories: getCategories() });
}
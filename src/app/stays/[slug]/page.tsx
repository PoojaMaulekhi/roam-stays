import type { Metadata } from "next";
import { getStay } from "@/lib/db";
import { StayDetail } from "@/components/stay-detail";
import { getStays } from "@/lib/db";

export const instant = false;

export function generateStaticParams() {
  return getStays().map((stay) => ({ slug: stay.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const stay = getStay(slug);
  if (!stay) return { title: "Stay not found" };
  return {
    title: stay.name,
    description: `${stay.description} Stay in ${stay.location} from ₹${stay.nightlyPrice.toLocaleString("en-IN")} per night.`,
    openGraph: { title: stay.name, description: `${stay.location} · ${stay.rating.toFixed(2)} guest rating`, images: stay.images.slice(0, 1) },
  };
}

export default async function StayPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <StayDetail slug={slug} />;
}
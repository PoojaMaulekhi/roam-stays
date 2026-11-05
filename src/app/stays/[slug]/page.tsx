import type { Metadata } from "next";
import { seedReviewCounts, seedReviews, seedStays } from "@/lib/db";
import { StayDetail } from "@/components/stay-detail";

export function generateStaticParams() {
  return seedStays.map((stay) => ({ slug: stay.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const stay = seedStays.find((item) => item.slug === slug);
  if (!stay) return { title: "Stay not found" };
  return {
    title: stay.name,
    description: `${stay.description} Stay in ${stay.location} from ₹${stay.nightlyPrice.toLocaleString("en-IN")} per night.`,
    openGraph: { title: stay.name, description: `${stay.location} · ${stay.rating.toFixed(2)} guest rating`, images: stay.images.slice(0, 1) },
  };
}

export default async function StayPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const stay = seedStays.find((item) => item.slug === slug);
  return <StayDetail
    slug={slug}
    initialStay={stay ? { ...stay, reviewCount: seedReviewCounts[slug] ?? 0 } : null}
    initialReviews={seedReviews[slug] ?? []}
  />;
}
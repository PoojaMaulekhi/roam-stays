import { RoamApp } from "@/components/roam-app";
import { seedReviewCounts, seedStays } from "@/lib/db";

export default function Home() {
  const stays = seedStays.map((stay) => ({ ...stay, reviewCount: seedReviewCounts[stay.slug] ?? 0 }));
  const categories = [
    { slug: "views", label: "Amazing views" },
    { slug: "cabins", label: "Cabins" },
    { slug: "beachfront", label: "Beachfront" },
    { slug: "farms", label: "Farms" },
    { slug: "mountains", label: "Mountains" },
    { slug: "pools", label: "Amazing pools" },
    { slug: "luxury", label: "Luxury stays" },
    { slug: "trending", label: "Trending" },
  ];
  return <RoamApp initialStays={stays} initialCategories={categories} />;
}

import { RoamApp } from "@/components/roam-app";
import { getCategories, getStays } from "@/lib/db";

export default function Home() {
  return <RoamApp initialStays={getStays()} initialCategories={getCategories()} />;
}

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { readSessionToken } from "@/lib/session";
import TripsPage from "@/app/trips/page";

export const instant = false;

export default async function MyBookingsPage() {
  const cookieStore = await cookies();
  const session = readSessionToken(cookieStore.get("roam_session")?.value);
  const account = session
    ? db.prepare("SELECT id FROM users WHERE id = ? AND email = ?").get(session.id, session.email)
    : null;

  if (!account) redirect("/?signin=1");
  return <TripsPage />;
}

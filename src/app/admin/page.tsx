import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { readSessionToken } from "@/lib/session";
import { db } from "@/lib/db";
import AdminDashboard from "./admin-dashboard";

export const instant = false;

export default async function AdminPage() {
  const cookieStore = await cookies();
  const user = readSessionToken(cookieStore.get("roam_session")?.value);

  const databaseUser = user
    ? db.prepare("SELECT role FROM users WHERE id = ? AND email = ?").get(user.id, user.email)
    : null;

  if (!user || databaseUser?.role !== "admin") {
    redirect(user ? "/" : "/?signin=1");
  }

  return <AdminDashboard />;
}

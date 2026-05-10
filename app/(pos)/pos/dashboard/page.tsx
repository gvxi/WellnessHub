import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifyEmployeeFromCookies } from "@/lib/auth/verify-employee";
import PosDashboardClient from "./_components/PosDashboardClient";

export default async function PosDashboardPage() {
  const cookieStore = await cookies();
  const ctx = await verifyEmployeeFromCookies(cookieStore);

  if (!ctx) redirect("/pos");

  return <PosDashboardClient permissions={ctx.permissions} employeeEmail={ctx.email} />;
}

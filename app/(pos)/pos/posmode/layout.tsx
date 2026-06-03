import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifyEmployeeFromCookies } from "@/lib/auth/verify-employee";
import PosShell from "@/app/(pos)/_components/PosShell";

export default async function PosModeLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const ctx = await verifyEmployeeFromCookies(cookieStore);

  if (!ctx) redirect("/pos");

  return <PosShell>{children}</PosShell>;
}

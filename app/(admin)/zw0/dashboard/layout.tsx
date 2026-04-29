import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createAuthedClient } from "@/lib/auth/verify-admin";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const token = cookieStore.get("admin-token")?.value;

  if (!token) redirect("/zw0");

  const supabase = createAuthedClient(token);
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) redirect("/zw0");

  return <>{children}</>;
}

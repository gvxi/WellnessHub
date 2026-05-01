import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createAuthedClient } from "@/lib/auth/verify-admin";
import LoginForm from "./_components/LoginForm";

export default async function AdminLoginPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("admin-token")?.value;

  if (token) {
    const supabase = createAuthedClient(token);
    const { data: { user }, error } = await supabase.auth.getUser();
    if (!error && user) redirect("/zw0/dashboard");
  }

  return <LoginForm />;
}

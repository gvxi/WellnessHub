import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import PosLoginForm from "./_components/PosLoginForm";

export default async function PosLoginPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("pos-token")?.value;

  if (token) {
    // Quick JWT presence check — middleware handles full validation on protected pages
    try {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          global: { headers: { Authorization: `Bearer ${token}` } },
          auth: { persistSession: false },
        }
      );
      const { data: { user } } = await supabase.auth.getUser();
      if (user) redirect("/pos/dashboard");
    } catch {}
  }

  return (
    <div className="min-h-screen bg-light flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <p className="text-[10px] uppercase tracking-[0.2em] font-semibold text-secondary/70 mb-1">
            Point of Sale
          </p>
          <h1 className="text-2xl font-bold text-dark tracking-tight">WellnessHub</h1>
        </div>
        <PosLoginForm />
      </div>
    </div>
  );
}

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifyEmployeeFromCookies } from "@/lib/auth/verify-employee";
import PosLoginForm from "./_components/PosLoginForm";

export default async function PosLoginPage() {
  const cookieStore = await cookies();
  const ctx = await verifyEmployeeFromCookies(cookieStore);
  if (ctx) redirect("/pos/dashboard");

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

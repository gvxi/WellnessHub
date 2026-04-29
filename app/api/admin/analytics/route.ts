import { NextRequest, NextResponse } from "next/server";
import { verifyAdmin, createAuthedClient } from "@/lib/auth/verify-admin";
import type { ApiAnalytics } from "@/lib/supabase/types";

export async function GET(request: NextRequest) {
  const ctx = await verifyAdmin(request);
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const token = request.cookies.get("admin-token")!.value;
  const supabase = createAuthedClient(token);

  const { data: bookings, error } = await supabase
    .from("bookings")
    .select("id, status, services(name)")
    .eq("business_id", ctx.businessId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const all = bookings ?? [];
  const approved = all.filter((b) => b.status === "approved");
  const pending = all.filter((b) => b.status === "pending");
  const rejected = all.filter((b) => b.status === "rejected");

  // Top services by booking count
  const serviceCount: Record<string, number> = {};
  for (const b of all) {
    const name = (b.services as any)?.name ?? "Unknown";
    serviceCount[name] = (serviceCount[name] ?? 0) + 1;
  }
  const top_services = Object.entries(serviceCount)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([service_name, count]) => ({ service_name, count }));

  const analytics: ApiAnalytics = {
    total: all.length,
    pending: pending.length,
    approved: approved.length,
    rejected: rejected.length,
    revenue: 0,
    top_services,
  };

  return NextResponse.json(analytics);
}

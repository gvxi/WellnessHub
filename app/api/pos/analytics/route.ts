import { NextRequest, NextResponse } from "next/server";
import { verifyEmployee } from "@/lib/auth/verify-employee";
import { createAuthedClient } from "@/lib/auth/verify-admin";
import type { ApiAnalytics } from "@/lib/supabase/types";

export async function GET(request: NextRequest) {
  const ctx = await verifyEmployee(request);
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const token = request.cookies.get("pos-token")!.value;
  const supabase = createAuthedClient(token);

  const { data: bookings, error } = await supabase
    .from("bookings")
    .select("id, status, cart_items, total_amount")
    .eq("business_id", ctx.businessId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const all = bookings ?? [];
  const approved = all.filter((b) => b.status === "approved");
  const pending = all.filter((b) => b.status === "pending");
  const rejected = all.filter((b) => b.status === "rejected");
  const revenue = approved.reduce((sum, b) => sum + Number((b as any).total_amount ?? 0), 0);

  const serviceCount: Record<string, { count: number; name_ar?: string }> = {};
  for (const b of all) {
    const items: { name: string; name_ar?: string }[] = (b as any).cart_items ?? [];
    for (const item of items) {
      const name = item.name ?? "Unknown";
      if (!serviceCount[name]) serviceCount[name] = { count: 0, name_ar: item.name_ar };
      serviceCount[name].count += 1;
    }
  }
  const top_services = Object.entries(serviceCount)
    .sort(([, a], [, b]) => b.count - a.count)
    .slice(0, 5)
    .map(([service_name, { count, name_ar }]) => ({ service_name, service_name_ar: name_ar ?? null, count }));

  const analytics: ApiAnalytics = {
    total: all.length,
    pending: pending.length,
    approved: approved.length,
    rejected: rejected.length,
    revenue,
    top_services,
  };

  return NextResponse.json(analytics);
}

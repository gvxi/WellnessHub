import { NextRequest, NextResponse } from "next/server";
import { verifyAdmin, createAuthedClient } from "@/lib/auth/verify-admin";

export async function GET(request: NextRequest) {
  const ctx = await verifyAdmin(request);
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");

  const token = request.cookies.get("admin-token")!.value;
  const supabase = createAuthedClient(token);

  let query = supabase
    .from("bookings")
    .select(`
      id, status, scheduled_at, notes, conflict_flag, created_at,
      customer_data, cart_items, total_amount,
      services ( name ),
      packages ( name ),
      payments ( transaction_id )
    `)
    .eq("business_id", ctx.businessId)
    .order("created_at", { ascending: false });

  if (status && status !== "all") {
    query = query.eq("status", status);
  }

  const { data, error } = await query;

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const bookings = (data ?? []).map((b: any) => ({
    id: b.id,
    status: b.status,
    scheduled_at: b.scheduled_at,
    notes: b.notes,
    conflict_flag: b.conflict_flag,
    created_at: b.created_at,
    customer_name: (b.customer_data as any)?.username ?? null,
    customer_email: (b.customer_data as any)?.email ?? null,
    service_name: (b.services as any)?.name ?? null,
    package_name: (b.packages as any)?.name ?? null,
    cart_items: b.cart_items ?? null,
    total_amount: b.total_amount ?? null,
    payment_reference: (b.payments as any)?.[0]?.transaction_id ?? null,
  }));

  return NextResponse.json(bookings);
}

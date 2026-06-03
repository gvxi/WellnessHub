import { NextRequest, NextResponse } from "next/server";
import { verifyAdmin, createAuthedClient } from "@/lib/auth/verify-admin";
import { adminClient } from "@/lib/supabase/admin";

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
      booking_by, created_by_user_id, payment_method,
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

  const rawBookings = (data ?? []).map((b: any) => ({
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
    booking_by: b.booking_by ?? "Customer",
    created_by_user_id: b.created_by_user_id ?? null,
    created_by_name: null as string | null,
    created_by_email: null as string | null,
    payment_method: b.payment_method ?? "Payment Gateway",
  }));

  // Resolve creator name + email from auth.users via admin API
  const creatorIds = [...new Set(rawBookings
    .filter(b => b.booking_by !== "Customer" && b.created_by_user_id)
    .map(b => b.created_by_user_id as string))];

  if (creatorIds.length > 0) {
    const { data: usersData } = await adminClient()
      .from("users")
      .select("id, full_name, email")
      .in("id", creatorIds);
    const creatorMap = Object.fromEntries(
      (usersData ?? []).map((u: any) => [u.id, { name: u.full_name ?? null, email: u.email ?? null }])
    );
    for (const b of rawBookings) {
      if (b.created_by_user_id && creatorMap[b.created_by_user_id]) {
        b.created_by_name = creatorMap[b.created_by_user_id].name;
        b.created_by_email = creatorMap[b.created_by_user_id].email;
      }
    }
  }

  return NextResponse.json(rawBookings);
}

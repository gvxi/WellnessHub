import { NextRequest, NextResponse } from "next/server";
import { verifyEmployee } from "@/lib/auth/verify-employee";
import { createAuthedClient } from "@/lib/auth/verify-admin";

export async function GET(request: NextRequest) {
  const ctx = await verifyEmployee(request);
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");

  const token = request.cookies.get("pos-token")!.value;
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

  // Booking delay filter — employee only sees bookings older than N minutes
  if (ctx.permissions.booking_delay_minutes > 0) {
    const cutoff = new Date(
      Date.now() - ctx.permissions.booking_delay_minutes * 60 * 1000
    ).toISOString();
    query = query.lte("created_at", cutoff);
  }

  // Status filter
  if (status && status !== "all") {
    query = query.eq("status", status);
  } else if (!ctx.permissions.show_rejected_bookings) {
    query = query.neq("status", "rejected");
  }

  // Customer email/phone filter
  const emailFilter = ctx.permissions.booking_filter_email;
  const phoneFilter = ctx.permissions.booking_filter_phone;
  if (emailFilter) {
    query = query.ilike("customer_data->>email", `%${emailFilter}%`);
  }
  if (phoneFilter) {
    query = query.ilike("customer_data->>phone", `%${phoneFilter}%`);
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
    customer_phone: (b.customer_data as any)?.phone ?? null,
    service_name: (b.services as any)?.name ?? null,
    package_name: (b.packages as any)?.name ?? null,
    cart_items: b.cart_items ?? null,
    total_amount: b.total_amount ?? null,
    payment_reference: (b.payments as any)?.[0]?.transaction_id ?? null,
  }));

  return NextResponse.json(bookings);
}

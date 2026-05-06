import { NextRequest, NextResponse } from "next/server";
import { verifyEmployee } from "@/lib/auth/verify-employee";
import { createAuthedClient } from "@/lib/auth/verify-admin";
import { createClient } from "@supabase/supabase-js";

function anonClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false } }
  );
}

async function sendBookingStatusEmail(payload: {
  to_email: string;
  user_id?: string;
  status: "approved" | "rejected";
  booking: { id: string; cart_items: unknown[]; total_amount: number };
}) {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) return;
  try {
    await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/send-booking-status`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${serviceKey}` },
      body: JSON.stringify(payload),
    });
  } catch {}
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const ctx = await verifyEmployee(request);
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { status, reason } = await request.json();

  const allowed = ["approved", "rejected", "refunded"];
  if (!allowed.includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const token = request.cookies.get("pos-token")!.value;
  const supabase = createAuthedClient(token);

  const { data: booking } = await supabase
    .from("bookings")
    .select("id, cart_items, total_amount, customer_data")
    .eq("id", id)
    .eq("business_id", ctx.businessId)
    .single();

  const updatePayload: Record<string, unknown> = { status, updated_at: new Date().toISOString() };
  if (reason) updatePayload.staff_notes = reason;

  const { error } = await supabase
    .from("bookings")
    .update(updatePayload)
    .eq("id", id)
    .eq("business_id", ctx.businessId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const customerData = (booking as any)?.customer_data as Record<string, string> | null;
  const customerName = customerData?.username ?? null;

  anonClient().rpc("admin_insert_alert", {
    p_business_id: ctx.businessId,
    p_type: `booking_${status}`,
    p_title: status === "approved" ? "Booking Approved" : status === "rejected" ? "Booking Rejected" : "Booking Refunded",
    p_body: customerName ? `${customerName}'s booking has been ${status}.` : `A booking has been ${status}.`,
    p_metadata: { booking_id: id, customer_name: customerName },
  }).then(null, () => {});

  if ((status === "approved" || status === "rejected") && booking) {
    const email = customerData?.email;
    const userId = customerData?.user_id;
    if (email) {
      await sendBookingStatusEmail({
        to_email: email,
        user_id: userId,
        status,
        booking: {
          id: (booking as any).id,
          cart_items: (booking as any).cart_items ?? [],
          total_amount: Number((booking as any).total_amount ?? 0),
        },
      });
    }
  }

  return NextResponse.json({ ok: true });
}

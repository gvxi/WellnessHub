import { NextRequest, NextResponse } from "next/server";
import { verifyAdmin, createAuthedClient } from "@/lib/auth/verify-admin";
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
  if (!serviceKey) {
    console.warn("SUPABASE_SERVICE_ROLE_KEY not set — booking status email skipped");
    return;
  }
  const edgeUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/send-booking-status`;
  try {
    const res = await fetch(edgeUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${serviceKey}`,
      },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      console.error("send-booking-status failed:", res.status, err);
    }
  } catch (err) {
    console.error("send-booking-status fetch error:", err);
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const ctx = await verifyAdmin(request);
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { status } = await request.json();

  const allowed = ["approved", "rejected", "refunded"];
  if (!allowed.includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const token = request.cookies.get("admin-token")!.value;
  const supabase = createAuthedClient(token);

  const { data: booking } = await supabase
    .from("bookings")
    .select("id, cart_items, total_amount, customer_data")
    .eq("id", id)
    .eq("business_id", ctx.businessId)
    .single();

  const { error } = await supabase
    .from("bookings")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("business_id", ctx.businessId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const customerData = (booking as any)?.customer_data as Record<string, string> | null;
  const customerName = customerData?.username ?? null;

  // Admin alert (fire-and-forget)
  anonClient().rpc("admin_insert_alert", {
    p_business_id: ctx.businessId,
    p_type: `booking_${status}`,
    p_title:
      status === "approved"
        ? "Booking Approved"
        : status === "rejected"
        ? "Booking Rejected"
        : "Booking Refunded",
    p_body: customerName
      ? `${customerName}'s booking has been ${status}.`
      : `A booking has been ${status}.`,
    p_metadata: { booking_id: id, customer_name: customerName },
  }).then(null, () => {});

  // Booking status email (awaited so serverless doesn't terminate early)
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

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

export async function POST(request: NextRequest) {
  let body: Record<string, unknown> = {};
  try {
    body = await request.json();
  } catch {
    // Paymob sometimes sends form-encoded
    const text = await request.text().catch(() => "");
    console.log("Paymob callback raw body:", text);
  }

  console.log("Paymob callback received:", JSON.stringify(body));

  const obj = body?.obj as Record<string, unknown> | undefined;
  const success = obj?.success === true;
  const orderObj = obj?.order as Record<string, unknown> | undefined;
  const merchantOrderId = orderObj?.merchant_order_id as string | undefined;
  const transactionId = String(obj?.id ?? "").trim() || null;

  if (success && merchantOrderId) {
    const supabase = adminClient();

    // Fetch booking to get business_id and amount
    const { data: booking } = await supabase
      .from("bookings")
      .select("business_id, total_amount")
      .eq("id", merchantOrderId)
      .single();

    // Approve the booking
    await supabase
      .from("bookings")
      .update({ status: "approved" })
      .eq("id", merchantOrderId)
      .eq("status", "pending");

    // Store payment reference
    if (transactionId && booking) {
      const amountCents = typeof obj?.amount_cents === "number" ? obj.amount_cents : null;
      await supabase
        .from("payments")
        .upsert(
          {
            booking_id: merchantOrderId,
            business_id: booking.business_id,
            amount: amountCents != null ? amountCents / 100 : (booking.total_amount ?? 0),
            currency: "OMR",
            payment_status: "success",
            transaction_id: transactionId,
          },
          { onConflict: "booking_id" }
        );
    }
  }

  return NextResponse.json({ received: true });
}

// Paymob also hits GET for redirection callbacks
export async function GET() {
  return NextResponse.json({ received: true });
}

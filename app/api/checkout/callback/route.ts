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
  const orderId = obj?.order as Record<string, unknown> | undefined;
  const merchantOrderId = orderId?.merchant_order_id as string | undefined;

  if (success && merchantOrderId) {
    const supabase = adminClient();
    await supabase
      .from("bookings")
      .update({ status: "approved" })
      .eq("id", merchantOrderId)
      .eq("status", "pending");
  }

  return NextResponse.json({ received: true });
}

// Paymob also hits GET for redirection callbacks
export async function GET() {
  return NextResponse.json({ received: true });
}

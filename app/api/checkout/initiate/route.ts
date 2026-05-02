import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const BUSINESS_ID = "86cd0b87-298a-4a56-a0c4-5f95a28d748b";
const PAYMOB_BASE = "https://accept.paymob.com/api";

/**
 * PAYMOB INTEGRATION GUIDE
 * ========================
 * This route implements the full 3-step Paymob Accept flow.
 * To go live, set these 4 environment variables:
 *
 *   PAYMOB_API_KEY          — Paymob dashboard → Settings → API Keys
 *   PAYMOB_INTEGRATION_ID   — Paymob dashboard → Integrations → Integration ID (number)
 *   PAYMOB_IFRAME_ID        — Paymob dashboard → Integrations → Iframe ID (number)
 *   PAYMOB_HMAC_SECRET      — Paymob dashboard → Settings → Security → HMAC secret
 *
 * WEBHOOK (app/api/checkout/webhook/route.ts — build separately):
 *   Configure Paymob dashboard → Integration → Transaction Response URL:
 *     https://your-domain.com/api/checkout/webhook
 *   Verify HMAC-SHA512: sort transaction fields alphabetically, concat values,
 *   compute HMAC-SHA512 with PAYMOB_HMAC_SECRET, compare to `hmac` field.
 *   On success (success=true, pending=false): update booking status → "approved".
 *
 * REDIRECT URLS (configure in Paymob dashboard → Integration):
 *   Success: https://your-domain.com/checkout/success
 *   Failure: https://your-domain.com/checkout/failed
 *   Paymob appends query params: ?success=true&id={txn_id}&order={order_id}
 */

type CartItemPayload = {
  id: string;
  qty: number;
  snapshot: {
    name: string;
    nameAr?: string;
    groupLabel?: string;
    numericPrice?: number;
  };
};

function makeAuthedClient(token: string) {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { global: { headers: { Authorization: `Bearer ${token}` } } }
  );
}

export async function POST(request: NextRequest) {
  // ── 1. Auth ──────────────────────────────────────────────────────────────
  const authHeader = request.headers.get("Authorization");
  const token = authHeader?.replace("Bearer ", "");
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = makeAuthedClient(token);
  const { data: { user }, error: userErr } = await supabase.auth.getUser();
  if (userErr || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // ── 2. Profile ───────────────────────────────────────────────────────────
  const { data: profile } = await supabase
    .from("profiles")
    .select("username, phone, age")
    .eq("id", user.id)
    .single();

  if (!profile?.username || !profile?.phone) {
    return NextResponse.json(
      { error: "incomplete_profile", message: "Complete your profile before checkout." },
      { status: 422 }
    );
  }

  // ── 3. Parse body ─────────────────────────────────────────────────────────
  const body = await request.json();
  const { items, subtotal } = body as { items: CartItemPayload[]; subtotal: number };

  if (!items?.length) {
    return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
  }

  // ── 4. Build cart_items JSONB ─────────────────────────────────────────────
  const cartItemsJson = items.map((i) => ({
    id: i.id,
    name: i.snapshot.name,
    name_ar: i.snapshot.nameAr ?? null,
    group_label: i.snapshot.groupLabel ?? null,
    qty: i.qty,
    unit_price: i.snapshot.numericPrice ?? 0,
    line_total: (i.snapshot.numericPrice ?? 0) * i.qty,
    currency: "OMR",
  }));

  const customerData = {
    user_id: user.id,
    email: user.email,
    username: profile.username,
    phone: profile.phone,
    age: profile.age ?? null,
  };

  // ── 5. Create booking (status: pending) ───────────────────────────────────
  const { data: booking, error: bookingErr } = await supabase
    .from("bookings")
    .insert({
      business_id: BUSINESS_ID,
      customer_id: user.id,
      scheduled_at: new Date().toISOString(),
      status: "pending",
      cart_items: cartItemsJson,
      customer_data: customerData,
      total_amount: subtotal,
    })
    .select("id")
    .single();

  if (bookingErr || !booking) {
    console.error("Booking insert error:", bookingErr);
    return NextResponse.json({ error: "Failed to create booking" }, { status: 500 });
  }

  // ── 6. DEV_MODE bypass ───────────────────────────────────────────────────
  if (process.env.DEV_MODE === "TRUE") {
    await supabase
      .from("bookings")
      .update({ status: "approved" })
      .eq("id", booking.id);
    return NextResponse.json({ status: "ok", payment_url: "/checkout/success", booking_id: booking.id });
  }

  // ── 7. Paymob (only if all env vars set) ──────────────────────────────────
  const {
    PAYMOB_API_KEY,
    PAYMOB_INTEGRATION_ID,
    PAYMOB_IFRAME_ID,
  } = process.env;

  if (!PAYMOB_API_KEY || !PAYMOB_INTEGRATION_ID || !PAYMOB_IFRAME_ID) {
    // Placeholder mode — booking created, payment not collected yet
    return NextResponse.json({
      status: "placeholder",
      booking_id: booking.id,
      message: "Paymob env vars not set. Booking created as pending.",
    });
  }

  try {
    // Step 1 — Auth token
    const authRes = await fetch(`${PAYMOB_BASE}/auth/tokens`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ api_key: PAYMOB_API_KEY }),
    });
    const { token: paymobToken } = await authRes.json() as { token: string };

    // Step 2 — Register order (amount in baisa: 1 OMR = 1000 baisa)
    const amountBaisa = Math.round(subtotal * 1000);
    const orderRes = await fetch(`${PAYMOB_BASE}/ecommerce/orders`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        auth_token: paymobToken,
        delivery_needed: false,
        amount_cents: amountBaisa,
        currency: "OMR",
        merchant_order_id: booking.id,
        items: cartItemsJson.map((i) => ({
          name: i.name,
          amount_cents: Math.round(i.unit_price * 1000),
          description: i.group_label ?? "",
          quantity: i.qty,
        })),
      }),
    });
    const { id: paymobOrderId } = await orderRes.json() as { id: number };

    // Step 3 — Payment key
    const [firstName, ...rest] = (profile.username ?? "Guest").split(" ");
    const keyRes = await fetch(`${PAYMOB_BASE}/acceptance/payment_keys`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        auth_token: paymobToken,
        amount_cents: amountBaisa,
        expiration: 3600,
        order_id: paymobOrderId,
        billing_data: {
          first_name: firstName,
          last_name: rest.join(" ") || ".",
          email: user.email ?? "N/A",
          phone_number: profile.phone,
          apartment: "N/A",
          floor: "N/A",
          street: "N/A",
          building: "N/A",
          shipping_method: "N/A",
          postal_code: "N/A",
          city: "Muscat",
          country: "OM",
          state: "Muscat",
        },
        currency: "OMR",
        integration_id: Number(PAYMOB_INTEGRATION_ID),
      }),
    });
    const { token: paymentToken } = await keyRes.json() as { token: string };

    // Update booking with Paymob order reference
    await supabase
      .from("bookings")
      .update({ payment_reference: String(paymobOrderId) })
      .eq("id", booking.id);

    const paymentUrl = `${PAYMOB_BASE}/acceptance/iframes/${PAYMOB_IFRAME_ID}?payment_token=${paymentToken}`;

    return NextResponse.json({ status: "ok", payment_url: paymentUrl, booking_id: booking.id });
  } catch (err) {
    console.error("Paymob error:", err);
    return NextResponse.json({ error: "Payment initiation failed" }, { status: 502 });
  }
}

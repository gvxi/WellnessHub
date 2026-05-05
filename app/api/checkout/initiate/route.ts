import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const RATE_WINDOW_MS = 10 * 60 * 1000;
const RATE_LIMIT = 3;
const MIN_ORDER_OMR = 1;

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

export async function POST(request: NextRequest) {
  const token = request.headers.get("Authorization")?.replace("Bearer ", "");
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const rayId: string | undefined = body.ray_id;

  if (!rayId) {
    return NextResponse.json({ error: "Missing ray_id" }, { status: 400 });
  }

  const devMode = !!process.env.DEV_MODE;
  if (!devMode && typeof body.subtotal === "number" && body.subtotal < MIN_ORDER_OMR) {
    return NextResponse.json({ error: "below_minimum" }, { status: 422 });
  }

  const supabase = adminClient();
  const windowStart = new Date(Date.now() - RATE_WINDOW_MS).toISOString();

  const { count, error: countErr } = await supabase
    .from("payment_rate_limits")
    .select("*", { count: "exact", head: true })
    .eq("ray_id", rayId)
    .gte("created_at", windowStart);

  if (countErr) {
    console.error("Rate limit check failed:", countErr);
  } else if ((count ?? 0) >= RATE_LIMIT) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  await supabase.from("payment_rate_limits").insert({ ray_id: rayId });

  const edgeUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/checkout-initiate`;
  const res = await fetch(edgeUrl, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const data = await res.json();
  if (!res.ok) {
    console.error("checkout-initiate edge function error:", data);
    return NextResponse.json(data, { status: res.status });
  }

  return NextResponse.json(data);
}

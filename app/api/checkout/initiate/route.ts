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
  try {
    const token = request.headers.get("Authorization")?.replace("Bearer ", "");
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let body: Record<string, unknown>;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "invalid_json" }, { status: 400 });
    }

    const rayId = body.ray_id as string | undefined;
    if (!rayId) {
      return NextResponse.json({ error: "Missing ray_id" }, { status: 400 });
    }

    const devMode = !!process.env.DEV_MODE;
    if (!devMode && typeof body.subtotal === "number" && body.subtotal < MIN_ORDER_OMR) {
      return NextResponse.json({ error: "below_minimum" }, { status: 422 });
    }

    if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
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
    }

    const edgeUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/checkout-initiate`;

    let edgeRes: Response;
    try {
      edgeRes = await fetch(edgeUrl, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });
    } catch (fetchErr) {
      console.error("checkout-initiate fetch threw:", fetchErr);
      return NextResponse.json({ error: "edge_unreachable", detail: String(fetchErr) }, { status: 502 });
    }

    const text = await edgeRes.text();
    let data: unknown;
    try {
      data = JSON.parse(text);
    } catch {
      console.error("checkout-initiate non-JSON:", edgeRes.status, text.slice(0, 500));
      return NextResponse.json({ error: "upstream_error", detail: text.slice(0, 200) }, { status: 502 });
    }

    if (!edgeRes.ok) {
      console.error("checkout-initiate edge error:", data);
      return NextResponse.json(data, { status: edgeRes.status });
    }

    return NextResponse.json(data);

  } catch (err) {
    console.error("checkout-initiate unhandled:", err);
    return NextResponse.json({ error: "unhandled", detail: String(err) }, { status: 500 });
  }
}

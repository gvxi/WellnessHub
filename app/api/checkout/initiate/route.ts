import { NextRequest, NextResponse } from "next/server";

const RATE_WINDOW_MS = 10 * 60 * 1000;
const RATE_LIMIT = 3;
const MIN_ORDER_OMR = 2;
const ipAttempts = new Map<string, number[]>();

export async function POST(request: NextRequest) {
  const token = request.headers.get("Authorization")?.replace("Bearer ", "");
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "unknown";
  const now = Date.now();
  const attempts = (ipAttempts.get(ip) ?? []).filter((t) => now - t < RATE_WINDOW_MS);
  if (attempts.length >= RATE_LIMIT) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }
  ipAttempts.set(ip, [...attempts, now]);

  const body = await request.json();

  if (typeof body.subtotal === "number" && body.subtotal < MIN_ORDER_OMR) {
    return NextResponse.json({ error: "below_minimum" }, { status: 422 });
  }

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

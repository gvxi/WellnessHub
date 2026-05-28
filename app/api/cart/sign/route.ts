import { createHmac, timingSafeEqual } from "crypto";
import { NextRequest, NextResponse } from "next/server";

function computeHmac(payload: string): string {
  const secret = process.env.CART_HMAC_SECRET;
  if (!secret) throw new Error("CART_HMAC_SECRET not configured");
  return createHmac("sha256", secret).update(payload, "utf8").digest("hex");
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as { action?: string; payload?: string; sig?: string };
    const { action, payload, sig } = body;

    if (!payload || typeof payload !== "string") {
      return NextResponse.json({ error: "missing_payload" }, { status: 400 });
    }

    if (action === "sign") {
      return NextResponse.json({ sig: computeHmac(payload) });
    }

    if (action === "verify") {
      if (!sig || typeof sig !== "string") {
        return NextResponse.json({ valid: false });
      }
      const expected = computeHmac(payload);
      const a = Buffer.from(expected, "hex");
      const b = Buffer.from(sig, "hex");
      const valid = a.length === b.length && timingSafeEqual(a, b);
      return NextResponse.json({ valid });
    }

    return NextResponse.json({ error: "invalid_action" }, { status: 400 });
  } catch {
    return NextResponse.json({ error: "internal" }, { status: 500 });
  }
}

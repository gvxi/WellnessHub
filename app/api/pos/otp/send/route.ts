import { NextRequest, NextResponse } from "next/server";
import { randomInt } from "crypto";
import { verifyActor } from "@/lib/auth/verify-actor";
import { adminClient } from "@/lib/supabase/admin";

// CSPRNG — no Math.random()
function generateOtp(): string {
  return String(randomInt(0, 1_000_000)).padStart(6, "0");
}

export async function POST(request: NextRequest) {
  const ctx = await verifyActor(request);
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const email: string = (body.email ?? "").trim().toLowerCase();
  const lang: string = body.lang === "ar" ? "ar" : "en";
  if (!email || !email.includes("@")) {
    return NextResponse.json({ error: "Invalid email" }, { status: 422 });
  }

  const otp = generateOtp();
  const supabase = adminClient();

  const { data: session, error } = await supabase
    .from("pos_otp_sessions")
    .insert({
      business_id: ctx.businessId,
      email,
      otp_code: otp,
      expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
    })
    .select("id")
    .single();

  if (error || !session) {
    console.error("[pos/otp/send] insert error:", JSON.stringify(error));
    return NextResponse.json({ error: "Failed to create OTP session", detail: error?.message, code: error?.code, hint: error?.hint }, { status: 500 });
  }

  // Send via edge function (Gmail SMTP)
  const efUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/send-pos-otp`;
  const efRes = await fetch(efUrl, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ to: email, code: otp, lang }),
  });

  if (!efRes.ok) {
    const efErr = await efRes.json().catch(() => ({}));
    console.error("[pos/otp/send] email error:", efErr);
    // OTP session was created — still return session_id so caller can retry verify
    // but surface email failure
    return NextResponse.json({ error: "Failed to send email", detail: (efErr as any).detail }, { status: 502 });
  }

  return NextResponse.json({ session_id: session.id });
}

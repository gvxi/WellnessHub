import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function makeAuthedClient(token: string) {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { global: { headers: { Authorization: `Bearer ${token}` } } }
  );
}

export async function POST(request: NextRequest) {
  const token = request.headers.get("Authorization")?.replace("Bearer ", "");
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = makeAuthedClient(token);
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expires = new Date(Date.now() + 10 * 60 * 1000).toISOString();

  await supabase
    .from("profiles")
    .upsert({ id: user.id, otp_code: code, otp_expires_at: expires });

  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey) {
    console.warn("RESEND_API_KEY not set — OTP code:", code);
    return NextResponse.json({ ok: true, dev_code: code });
  }

  const html = `
    <div style="font-family:sans-serif;max-width:400px;margin:0 auto;padding:32px">
      <h2 style="color:#5A0F1B;margin-bottom:8px">Verification Code</h2>
      <p style="color:#444;margin-bottom:24px">Enter this code to complete your booking:</p>
      <div style="font-size:36px;font-weight:700;letter-spacing:8px;color:#0E0B0D;
                  background:#F2EDEE;padding:20px;border-radius:12px;text-align:center">
        ${code}
      </div>
      <p style="color:#888;font-size:12px;margin-top:20px">
        Expires in 10 minutes. Do not share this code.
      </p>
    </div>
  `;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${resendKey}`,
    },
    body: JSON.stringify({
      from: "WellnessHub <noreply@welln.lol>",
      to: [user.email],
      subject: "Your WellnessHub verification code",
      html,
    }),
  });

  if (!res.ok) {
    const err = await res.json();
    console.error("Resend OTP error:", err);
    return NextResponse.json({ error: "Failed to send OTP" }, { status: 502 });
  }

  return NextResponse.json({ ok: true });
}

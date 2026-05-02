import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const token = request.headers.get("Authorization")?.replace("Bearer ", "");
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const edgeUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/send-otp`;

  const res = await fetch(edgeUrl, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  const data = await res.json();

  if (!res.ok) {
    console.error("send-otp edge function error:", data);
    return NextResponse.json(
      { error: data.error ?? "Failed to send OTP", detail: data.detail },
      { status: res.status }
    );
  }

  return NextResponse.json({ ok: true });
}

import { NextRequest, NextResponse } from "next/server";
import { verifyActor } from "@/lib/auth/verify-actor";
import { adminClient } from "@/lib/supabase/admin";

export async function POST(request: NextRequest) {
  const ctx = await verifyActor(request);
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const sessionId: string = body.session_id ?? "";
  const code: string = String(body.code ?? "").trim();

  if (!sessionId || !code) {
    return NextResponse.json({ error: "Missing fields" }, { status: 422 });
  }

  const supabase = adminClient();

  const { data: session, error } = await supabase
    .from("pos_otp_sessions")
    .select("id, otp_code, expires_at, verified, business_id")
    .eq("id", sessionId)
    .single();

  if (error || !session) {
    return NextResponse.json({ error: "invalid" }, { status: 422 });
  }

  if (session.business_id !== ctx.businessId) {
    return NextResponse.json({ error: "invalid" }, { status: 422 });
  }

  if (session.verified) {
    return NextResponse.json({ error: "already_used" }, { status: 422 });
  }

  if (new Date() > new Date(session.expires_at)) {
    return NextResponse.json({ error: "expired" }, { status: 422 });
  }

  if (code !== session.otp_code) {
    return NextResponse.json({ error: "invalid" }, { status: 422 });
  }

  await supabase
    .from("pos_otp_sessions")
    .update({ verified: true })
    .eq("id", sessionId);

  return NextResponse.json({ ok: true });
}

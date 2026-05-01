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
  if (error || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { code } = await request.json() as { code: string };

  const { data: profile } = await supabase
    .from("profiles")
    .select("otp_code, otp_expires_at")
    .eq("id", user.id)
    .single();

  if (!profile?.otp_code) {
    return NextResponse.json({ error: "no_otp" }, { status: 422 });
  }
  if (profile.otp_expires_at && new Date() > new Date(profile.otp_expires_at)) {
    return NextResponse.json({ error: "expired" }, { status: 422 });
  }
  if (code !== profile.otp_code) {
    return NextResponse.json({ error: "invalid" }, { status: 422 });
  }

  await supabase
    .from("profiles")
    .update({ otp_code: null, otp_expires_at: null })
    .eq("id", user.id);

  return NextResponse.json({ ok: true });
}

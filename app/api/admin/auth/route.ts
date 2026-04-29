import { NextRequest, NextResponse } from "next/server";
import { createAuthedClient } from "@/lib/auth/verify-admin";

const EDGE_URL = process.env.SUPABASE_EDGE_FUNCTION_URL!;
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// POST /api/admin/auth — login
export async function POST(request: NextRequest) {
  const { email, password } = await request.json();

  if (!email || !password) {
    return NextResponse.json({ error: "Email and password required" }, { status: 400 });
  }

  const efRes = await fetch(`${EDGE_URL}/admin-auth`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${ANON_KEY}` },
    body: JSON.stringify({ email, password }),
  });

  const efData = await efRes.json();

  if (!efRes.ok || !efData.session) {
    return NextResponse.json(
      { error: efData.error ?? "Authentication failed" },
      { status: efRes.status }
    );
  }

  const { session } = efData;

  // Verify role + fetch business_id server-side (avoids EF RLS context issues)
  // Must call setSession so Supabase JS v2 uses the user JWT (not anon key) for RLS queries
  const supabase = createAuthedClient(session.access_token);
  await supabase.auth.setSession({
    access_token: session.access_token,
    refresh_token: session.refresh_token,
  });

  const userId = session.user?.id ?? efData.user?.id;

  const [{ data: userRow }, { data: buRow }] = await Promise.all([
    supabase.from("users").select("id, email, full_name, role").eq("id", userId).single(),
    supabase.from("business_users").select("business_id").eq("user_id", userId).single(),
  ]);

  if (!userRow || userRow.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized: admin access required" }, { status: 403 });
  }

  const businessId = buRow?.business_id ?? "";

  const response = NextResponse.json({ ok: true, user: userRow });

  const cookieOpts = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: 60 * 60, // 1 hour
  };

  response.cookies.set("admin-token", session.access_token, cookieOpts);
  response.cookies.set("admin-biz", businessId, cookieOpts);

  return response;
}

// GET /api/admin/auth — verify session
export async function GET(request: NextRequest) {
  const token = request.cookies.get("admin-token")?.value;
  if (!token) return NextResponse.json({ error: "No session" }, { status: 401 });

  const supabase = createAuthedClient(token);
  await supabase.auth.setSession({ access_token: token, refresh_token: "" });

  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) return NextResponse.json({ error: "Invalid session" }, { status: 401 });

  const { data: userRow } = await supabase
    .from("users")
    .select("id, email, full_name, role")
    .eq("id", user.id)
    .single();

  if (userRow?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json({ user: userRow });
}

// DELETE /api/admin/auth — logout
export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.delete("admin-token");
  response.cookies.delete("admin-biz");
  return response;
}

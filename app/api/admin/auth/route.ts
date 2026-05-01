import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const EDGE_URL = process.env.SUPABASE_EDGE_FUNCTION_URL!;
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;

// Anon client — used only for SECURITY DEFINER RPCs (no RLS needed)
function anonClient() {
  return createClient(SUPABASE_URL, ANON_KEY, { auth: { persistSession: false } });
}

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
  const userId: string = session.user?.id ?? efData.user?.id;

  // SECURITY DEFINER RPC — bypasses RLS, no JWT threading needed
  const { data: ctx, error: ctxErr } = await anonClient().rpc("get_admin_context", { uid: userId });

  if (ctxErr || !ctx || ctx.length === 0) {
    return NextResponse.json({ error: "User not found" }, { status: 403 });
  }

  const { role, business_id } = ctx[0] as { role: string; business_id: string };

  if (role !== "admin") {
    return NextResponse.json({ error: "Unauthorized: admin access required" }, { status: 403 });
  }

  const response = NextResponse.json({
    ok: true,
    user: { id: userId, email: efData.user?.email, role },
  });

  const cookieOpts = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: 60 * 60,
  };

  response.cookies.set("admin-token", session.access_token, cookieOpts);
  response.cookies.set("admin-biz", business_id ?? "", cookieOpts);

  return response;
}

// GET /api/admin/auth — verify session
export async function GET(request: NextRequest) {
  const token = request.cookies.get("admin-token")?.value;
  if (!token) return NextResponse.json({ error: "No session" }, { status: 401 });

  // Validate the JWT via auth.getUser (uses global Authorization header — auth calls work fine)
  const supabase = createClient(SUPABASE_URL, ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false },
  });

  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return NextResponse.json({ error: "Invalid session" }, { status: 401 });

  const { data: ctx } = await anonClient().rpc("get_admin_context", { uid: user.id });

  if (!ctx || ctx.length === 0 || ctx[0].role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json({ user: { id: user.id, email: user.email, role: ctx[0].role } });
}

// PUT /api/admin/auth — extend session (sliding expiry)
export async function PUT(request: NextRequest) {
  const token = request.cookies.get("admin-token")?.value;
  const biz = request.cookies.get("admin-biz")?.value;
  if (!token) return NextResponse.json({ error: "No session" }, { status: 401 });

  const supabase = createClient(SUPABASE_URL, ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false },
  });

  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return NextResponse.json({ error: "Session expired" }, { status: 401 });

  const response = NextResponse.json({ ok: true });
  const cookieOpts = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: 60 * 60,
  };
  response.cookies.set("admin-token", token, cookieOpts);
  if (biz) response.cookies.set("admin-biz", biz, cookieOpts);
  return response;
}

// DELETE /api/admin/auth — logout
export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.delete("admin-token");
  response.cookies.delete("admin-biz");
  return response;
}

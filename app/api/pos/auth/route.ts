import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const EDGE_URL = process.env.SUPABASE_EDGE_FUNCTION_URL!;
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;

function anonClient() {
  return createClient(SUPABASE_URL, ANON_KEY, { auth: { persistSession: false } });
}

const COOKIE_OPTS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: 60 * 60,
};

// POST /api/pos/auth — employee login
export async function POST(request: NextRequest) {
  const { email, password } = await request.json();
  if (!email || !password) {
    return NextResponse.json({ error: "Email and password required" }, { status: 400 });
  }

  // Reuse admin-auth edge function — it just does signInWithPassword
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

  const { data: ctx } = await anonClient().rpc("get_employee_context", { uid: userId });
  if (!ctx || ctx.length === 0) {
    return NextResponse.json({ error: "Employee account not found" }, { status: 403 });
  }

  const row = ctx[0];
  if (!row.is_active) {
    return NextResponse.json({ error: "Account is inactive" }, { status: 403 });
  }

  // Rotate session token — invalidates any previous session
  const newSessionToken = crypto.randomUUID();
  await anonClient().rpc("rotate_employee_session", {
    uid: userId,
    new_token: newSessionToken,
  });

  const response = NextResponse.json({
    ok: true,
    user: { id: userId, email: efData.user?.email },
  });

  response.cookies.set("pos-token", session.access_token, COOKIE_OPTS);
  response.cookies.set("pos-biz", row.business_id, COOKIE_OPTS);
  response.cookies.set("pos-session", newSessionToken, COOKIE_OPTS);

  return response;
}

// GET /api/pos/auth — verify session
export async function GET(request: NextRequest) {
  const token = request.cookies.get("pos-token")?.value;
  const sessionToken = request.cookies.get("pos-session")?.value;
  if (!token || !sessionToken) {
    return NextResponse.json({ error: "No session" }, { status: 401 });
  }

  const supabase = createClient(SUPABASE_URL, ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false },
  });

  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return NextResponse.json({ error: "Invalid session" }, { status: 401 });

  const { data: ctx } = await anonClient().rpc("get_employee_context", { uid: user.id });
  if (!ctx || ctx.length === 0 || !ctx[0].is_active || ctx[0].current_session_token !== sessionToken) {
    return NextResponse.json({ error: "Session invalid" }, { status: 401 });
  }

  return NextResponse.json({ user: { id: user.id, email: user.email } });
}

// PUT /api/pos/auth — extend session
export async function PUT(request: NextRequest) {
  const token = request.cookies.get("pos-token")?.value;
  const biz = request.cookies.get("pos-biz")?.value;
  const sessionToken = request.cookies.get("pos-session")?.value;
  if (!token || !sessionToken) {
    return NextResponse.json({ error: "No session" }, { status: 401 });
  }

  const supabase = createClient(SUPABASE_URL, ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false },
  });

  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return NextResponse.json({ error: "Session expired" }, { status: 401 });

  // Check session still valid in DB
  const { data: ctx } = await anonClient().rpc("get_employee_context", { uid: user.id });
  if (!ctx || ctx.length === 0 || !ctx[0].is_active || ctx[0].current_session_token !== sessionToken) {
    return NextResponse.json({ error: "Session invalid" }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set("pos-token", token, COOKIE_OPTS);
  if (biz) response.cookies.set("pos-biz", biz, COOKIE_OPTS);
  response.cookies.set("pos-session", sessionToken, COOKIE_OPTS);
  return response;
}

// DELETE /api/pos/auth — logout
export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.delete("pos-token");
  response.cookies.delete("pos-biz");
  response.cookies.delete("pos-session");
  return response;
}

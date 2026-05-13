import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { verifyEmployee } from "@/lib/auth/verify-employee";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

function anonClient() {
  return createClient(SUPABASE_URL, ANON_KEY, { auth: { persistSession: false } });
}

function adminClient() {
  return createClient(SUPABASE_URL, SERVICE_ROLE_KEY, { auth: { persistSession: false } });
}

// GET /api/pos/team — list sub users created by the calling Main POS user
export async function GET(request: NextRequest) {
  const ctx = await verifyEmployee(request);
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (ctx.posUserType !== 'main' || !ctx.canCreateSubUsers) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data, error } = await anonClient().rpc("pos_list_sub_users", {
    p_caller_user_id: ctx.userId,
    p_business_id: ctx.businessId,
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ employees: data ?? [] });
}

// POST /api/pos/team — create a sub user under the calling Main POS user
export async function POST(request: NextRequest) {
  const ctx = await verifyEmployee(request);
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (ctx.posUserType !== 'main' || !ctx.canCreateSubUsers) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { email, password, full_name } = body;
    if (!email || !password || !full_name) {
      return NextResponse.json({ error: "email, password, full_name required" }, { status: 400 });
    }

    const supabaseAdmin = adminClient();

    // Create auth user
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (authError || !authData.user) {
      return NextResponse.json({ error: authError?.message ?? "Failed to create user" }, { status: 400 });
    }

    const userId = authData.user.id;

    // Create DB records and set permissions atomically
    const { error: recordError } = await anonClient().rpc("pos_create_sub_user_record", {
      p_user_id: userId,
      p_email: email,
      p_full_name: full_name,
      p_business_id: ctx.businessId,
      p_parent_user_id: ctx.userId,
      p_tab_bookings: body.tab_bookings ?? 'enabled',
      p_tab_services: body.tab_services ?? 'read-only',
      p_tab_ads: body.tab_ads ?? 'read-only',
      p_tab_analytics: body.tab_analytics ?? 'hidden',
      p_tab_settings: body.tab_settings ?? 'hidden',
      p_tab_about: body.tab_about ?? 'hidden',
      p_show_rejected: body.show_rejected_bookings ?? false,
      p_booking_delay: body.booking_delay_minutes ?? 0,
      p_is_active: body.is_active ?? true,
    });

    if (recordError) {
      await supabaseAdmin.auth.admin.deleteUser(userId);
      return NextResponse.json({ error: recordError.message }, { status: 500 });
    }

    return NextResponse.json({ user_id: userId }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/pos/team]", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

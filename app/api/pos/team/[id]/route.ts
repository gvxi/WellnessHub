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

// PUT /api/pos/team/[id] — update sub user permissions
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const ctx = await verifyEmployee(request);
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (ctx.posUserType !== 'main' || !ctx.canCreateSubUsers) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id: targetUserId } = await params;
  const body = await request.json();

  if (body.full_name) {
    await anonClient().rpc("update_user_full_name", { p_user_id: targetUserId, p_full_name: body.full_name });
  }

  if (body.licence !== undefined || body.real_email !== undefined || body.phone !== undefined) {
    await anonClient().rpc("upsert_employee_profile", {
      p_user_id: targetUserId,
      p_licence: body.licence ?? null,
      p_real_email: body.real_email ?? null,
      p_phone: body.phone ?? null,
    });
  }

  const { error } = await anonClient().rpc("pos_update_sub_user_permissions", {
    p_caller_user_id: ctx.userId,
    p_target_user_id: targetUserId,
    p_business_id: ctx.businessId,
    p_can_edit_services: body.tab_services === 'enabled',
    p_can_edit_ads: body.tab_ads === 'enabled',
    p_show_rejected: body.show_rejected_bookings ?? false,
    p_booking_delay: body.booking_delay_minutes ?? 0,
    p_is_active: body.is_active ?? true,
    p_can_manage_bookings: body.tab_bookings === 'enabled',
    p_tab_bookings: body.tab_bookings ?? 'enabled',
    p_tab_services: body.tab_services ?? 'read-only',
    p_tab_ads: body.tab_ads ?? 'read-only',
    p_tab_analytics: body.tab_analytics ?? 'hidden',
    p_tab_settings: body.tab_settings ?? 'hidden',
    p_tab_about: body.tab_about ?? 'hidden',
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}

// DELETE /api/pos/team/[id] — remove a sub user
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const ctx = await verifyEmployee(request);
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (ctx.posUserType !== 'main' || !ctx.canCreateSubUsers) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id: targetUserId } = await params;

  // Remove DB records (RPC verifies ownership)
  const { error: deleteError } = await anonClient().rpc("pos_delete_sub_user_record", {
    p_caller_user_id: ctx.userId,
    p_target_user_id: targetUserId,
    p_business_id: ctx.businessId,
  });

  if (deleteError) return NextResponse.json({ error: deleteError.message }, { status: 500 });

  // Remove auth user
  await adminClient().auth.admin.deleteUser(targetUserId);

  return NextResponse.json({ ok: true });
}

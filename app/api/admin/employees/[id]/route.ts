import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { verifyAdmin } from "@/lib/auth/verify-admin";

const EDGE_URL = process.env.SUPABASE_EDGE_FUNCTION_URL!;
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;

function anonClient() {
  return createClient(SUPABASE_URL, ANON_KEY, { auth: { persistSession: false } });
}

// PUT /api/admin/employees/[id] — update permissions
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const ctx = await verifyAdmin(request);
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: userId } = await params;
  const body = await request.json();

  const { error } = await anonClient().rpc("admin_update_employee_permissions", {
    p_user_id: userId,
    p_business_id: ctx.businessId,
    p_can_edit_services: body.can_edit_services ?? false,
    p_can_edit_ads: body.can_edit_ads ?? false,
    p_show_rejected: body.show_rejected_bookings ?? false,
    p_booking_delay: body.booking_delay_minutes ?? 0,
    p_filter_email: body.booking_filter_email ?? "",
    p_filter_phone: body.booking_filter_phone ?? "",
    p_is_active: body.is_active ?? true,
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}

// DELETE /api/admin/employees/[id] — remove employee
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const ctx = await verifyAdmin(request);
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: userId } = await params;
  const token = request.cookies.get("admin-token")?.value!;

  const efRes = await fetch(`${EDGE_URL}/employee-admin`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ user_id: userId }),
  });

  const efData = await efRes.json();
  if (!efRes.ok) {
    return NextResponse.json({ error: efData.error ?? "Failed to delete employee" }, { status: efRes.status });
  }

  return NextResponse.json({ ok: true });
}

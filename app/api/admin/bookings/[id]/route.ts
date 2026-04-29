import { NextRequest, NextResponse } from "next/server";
import { verifyAdmin, createAuthedClient } from "@/lib/auth/verify-admin";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const ctx = await verifyAdmin(request);
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { status } = await request.json();

  const allowed = ["approved", "rejected", "refunded"];
  if (!allowed.includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const token = request.cookies.get("admin-token")!.value;
  const supabase = createAuthedClient(token);

  const { error } = await supabase
    .from("bookings")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("business_id", ctx.businessId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}

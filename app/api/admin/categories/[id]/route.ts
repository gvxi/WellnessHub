import { NextRequest, NextResponse } from "next/server";
import { verifyAdmin, createAuthedClient } from "@/lib/auth/verify-admin";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const ctx = await verifyAdmin(request);
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await request.json();

  const token = request.cookies.get("admin-token")!.value;
  const supabase = createAuthedClient(token);

  const { data, error } = await supabase
    .from("categories")
    .update(body)
    .eq("id", id)
    .eq("business_id", ctx.businessId)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(data);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const ctx = await verifyAdmin(request);
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const token = request.cookies.get("admin-token")!.value;
  const supabase = createAuthedClient(token);

  const { error } = await supabase
    .from("categories")
    .delete()
    .eq("id", id)
    .eq("business_id", ctx.businessId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}

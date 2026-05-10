import { NextRequest, NextResponse } from "next/server";
import { verifyEmployee } from "@/lib/auth/verify-employee";
import { createAuthedClient } from "@/lib/auth/verify-admin";

export async function GET(request: NextRequest) {
  const ctx = await verifyEmployee(request);
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const token = request.cookies.get("pos-token")!.value;
  const supabase = createAuthedClient(token);

  const { data, error } = await supabase
    .from("services")
    .select(`
      id, name, description, group_label, unsplash_id, image_url, display_order, is_active, category_id, translations,
      categories ( name, translations ),
      packages ( id, name, price, currency, icon, display_order, is_active, translations )
    `)
    .eq("business_id", ctx.businessId)
    .order("display_order");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(data ?? []);
}

export async function POST(request: NextRequest) {
  const ctx = await verifyEmployee(request);
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (ctx.permissions.tab_services !== "enabled") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const token = request.cookies.get("pos-token")!.value;
  const supabase = createAuthedClient(token);

  const { data: existing } = await supabase.from("services").select("id").eq("business_id", ctx.businessId);
  const displayOrder = (existing ?? []).length;

  const { data, error } = await supabase
    .from("services")
    .insert({ ...body, business_id: ctx.businessId, display_order: displayOrder })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(data, { status: 201 });
}

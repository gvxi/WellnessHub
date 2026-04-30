import { NextRequest, NextResponse } from "next/server";
import { verifyAdmin, createAuthedClient } from "@/lib/auth/verify-admin";

export async function POST(request: NextRequest) {
  const ctx = await verifyAdmin(request);
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { service_id, name, price, currency, display_order } = body;

  if (!service_id || !name || price == null) {
    return NextResponse.json({ error: "service_id, name, price required" }, { status: 400 });
  }

  const token = request.cookies.get("admin-token")!.value;
  const supabase = createAuthedClient(token);

  const { data, error } = await supabase
    .from("packages")
    .insert({
      business_id: ctx.businessId,
      service_id,
      name,
      price: Number(price),
      currency: currency ?? "OMR",
      display_order: display_order ?? 0,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(data, { status: 201 });
}

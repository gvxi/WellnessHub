import { NextRequest, NextResponse } from "next/server";
import { verifyEmployee } from "@/lib/auth/verify-employee";
import { createAuthedClient } from "@/lib/auth/verify-admin";

export async function GET(request: NextRequest) {
  const ctx = await verifyEmployee(request);
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const token = request.cookies.get("pos-token")!.value;
  const supabase = createAuthedClient(token);

  const { data, error } = await supabase
    .from("packages")
    .select("id, name, description, price, currency, icon, display_order, is_active, service_id, translations")
    .eq("business_id", ctx.businessId)
    .order("display_order");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(data ?? []);
}

import { NextRequest, NextResponse } from "next/server";
import { verifyAdmin, createAuthedClient } from "@/lib/auth/verify-admin";

export async function GET(request: NextRequest) {
  const ctx = await verifyAdmin(request);
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const token = request.cookies.get("admin-token")!.value;
  const supabase = createAuthedClient(token);

  const { data, error } = await supabase
    .from("ads")
    .select("id, headline, subtitle, unsplash_id, badge_text, is_active, display_order")
    .eq("business_id", ctx.businessId)
    .order("display_order");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(data ?? []);
}

export async function POST(request: NextRequest) {
  const ctx = await verifyAdmin(request);
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { headline, subtitle, unsplash_id, badge_text, display_order } = body;

  if (!headline) return NextResponse.json({ error: "Headline required" }, { status: 400 });

  const token = request.cookies.get("admin-token")!.value;
  const supabase = createAuthedClient(token);

  const { data, error } = await supabase
    .from("ads")
    .insert({
      business_id: ctx.businessId,
      headline,
      subtitle,
      unsplash_id,
      badge_text: badge_text ?? "Ad",
      display_order: display_order ?? 0,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(data, { status: 201 });
}

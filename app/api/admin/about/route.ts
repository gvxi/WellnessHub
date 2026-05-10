import { NextRequest, NextResponse } from "next/server";
import { verifyAdmin, createAuthedClient } from "@/lib/auth/verify-admin";
import type { AboutData } from "@/lib/supabase/types";

export async function GET(request: NextRequest) {
  const ctx = await verifyAdmin(request);
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const token = request.cookies.get("admin-token")!.value;
  const supabase = createAuthedClient(token);

  const { data, error } = await supabase
    .from("about_settings")
    .select("content")
    .eq("business_id", ctx.businessId)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(data.content as AboutData);
}

export async function PUT(request: NextRequest) {
  const ctx = await verifyAdmin(request);
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body: AboutData = await request.json();
  const token = request.cookies.get("admin-token")!.value;
  const supabase = createAuthedClient(token);

  const { error } = await supabase
    .from("about_settings")
    .upsert(
      { business_id: ctx.businessId, content: body, updated_at: new Date().toISOString() },
      { onConflict: "business_id" }
    );

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}

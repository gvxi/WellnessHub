import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import type { AboutData } from "@/lib/supabase/types";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET() {
  const { data, error } = await supabase
    .from("about_settings")
    .select("content")
    .limit(1)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(data.content as AboutData, {
    headers: { "Cache-Control": "s-maxage=60, stale-while-revalidate=300" },
  });
}

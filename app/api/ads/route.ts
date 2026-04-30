import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import type { ApiAd } from "@/lib/supabase/types";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET() {
  const { data, error } = await supabase
    .from("ads")
    .select("id, headline, subtitle, unsplash_id, image_url, badge_text, fullscreen_enabled, display_order")
    .eq("is_active", true)
    .order("display_order", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const ads: ApiAd[] = (data ?? []).map((ad) => ({
    id: ad.id,
    headline: ad.headline,
    subtitle: ad.subtitle,
    unsplash_id: ad.unsplash_id,
    image_url: ad.image_url,
    badge_text: ad.badge_text,
    fullscreen_enabled: ad.fullscreen_enabled ?? false,
    display_order: ad.display_order,
  }));

  return NextResponse.json(ads, {
    headers: { "Cache-Control": "s-maxage=60, stale-while-revalidate=300" },
  });
}

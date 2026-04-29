import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import type { ApiCategory, ApiGroup, ApiService } from "@/lib/supabase/types";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET() {
  const { data, error } = await supabase
    .from("categories")
    .select(`
      id, name, subtitle, unsplash_id, slug, display_order,
      services (
        id, name, description, group_label, unsplash_id, display_order,
        packages ( id, name, description, price, currency, note, display_order )
      )
    `)
    .order("display_order", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const categories: ApiCategory[] = (data ?? []).map((cat) => {
    const services = [...(cat.services ?? [])]
      .sort((a, b) => a.display_order - b.display_order);

    // Group services by group_label preserving first-appearance order
    const groupMap = new Map<string, ApiService[]>();
    for (const svc of services) {
      const label = svc.group_label ?? "Other";
      if (!groupMap.has(label)) groupMap.set(label, []);
      groupMap.get(label)!.push({
        id: svc.id,
        name: svc.name,
        description: svc.description,
        group_label: svc.group_label,
        unsplash_id: svc.unsplash_id,
        packages: [...(svc.packages ?? [])]
          .sort((a, b) => a.display_order - b.display_order)
          .map((p) => ({
            id: p.id,
            name: p.name,
            description: p.description,
            price: p.price,
            currency: p.currency,
            note: p.note,
            display_order: p.display_order,
          })),
      });
    }

    const groups: ApiGroup[] = Array.from(groupMap.entries()).map(([label, svcs]) => ({
      label,
      services: svcs,
    }));

    return {
      id: cat.id,
      name: cat.name,
      subtitle: cat.subtitle,
      unsplash_id: cat.unsplash_id,
      slug: cat.slug,
      display_order: cat.display_order,
      groups,
    };
  });

  return NextResponse.json(categories, {
    headers: { "Cache-Control": "s-maxage=60, stale-while-revalidate=300" },
  });
}

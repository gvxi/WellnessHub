import { createClient } from "@supabase/supabase-js";
import type { Category, SubCategory, ServiceItem } from "@/lib/services-data";
import type { ApiCategory, ApiService, Translations } from "@/lib/supabase/types";

function makeSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

async function fetchApiCategories(): Promise<ApiCategory[]> {
  const supabase = makeSupabase();
  const { data, error } = await supabase
    .from("categories")
    .select(`
      id, name, subtitle, unsplash_id, image_url, slug, display_order, translations,
      services (
        id, name, description, group_label, unsplash_id, display_order, is_active, translations,
        packages ( id, name, description, price, currency, note, icon, display_order, translations )
      )
    `)
    .order("display_order", { ascending: true });

  if (error || !data) return [];

  return data.map((cat) => {
    const services = [...(cat.services ?? [])]
      .filter((s) => s.is_active !== false)
      .sort((a, b) => a.display_order - b.display_order);

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
        translations: (svc.translations as Translations) ?? {},
        packages: [...(svc.packages ?? [])]
          .sort((a, b) => a.display_order - b.display_order)
          .map((p) => ({
            id: p.id,
            name: p.name,
            description: p.description,
            price: p.price,
            currency: p.currency,
            note: p.note,
            icon: p.icon,
            display_order: p.display_order,
            translations: (p.translations as Translations) ?? {},
          })),
      });
    }

    return {
      id: cat.id,
      name: cat.name,
      subtitle: cat.subtitle,
      unsplash_id: cat.unsplash_id,
      image_url: cat.image_url,
      slug: cat.slug,
      display_order: cat.display_order,
      translations: (cat.translations as Translations) ?? {},
      groups: Array.from(groupMap.entries()).map(([label, svcs]) => ({ label, services: svcs })),
    };
  });
}

export async function fetchSectionArMap(): Promise<Map<string, string>> {
  const supabase = makeSupabase();
  const { data } = await supabase.from("section_labels").select("name, translations");
  const map = new Map<string, string>();
  for (const row of data ?? []) {
    const ar = (row.translations as { ar?: { name?: string } })?.ar?.name;
    if (ar) map.set(row.name, ar);
  }
  return map;
}

export function apiToCategory(cat: ApiCategory, sectionArMap: Map<string, string>): Category {
  return {
    id: cat.slug ?? cat.id,
    title: cat.name,
    titleAr: cat.translations?.ar?.name,
    subtitle: cat.subtitle ?? "",
    subtitleAr: cat.translations?.ar?.subtitle,
    unsplashId: cat.unsplash_id ?? "",
    imageUrl: cat.image_url ?? undefined,
    subs: cat.groups.map((g): SubCategory => ({
      title: g.label,
      titleAr: sectionArMap.get(g.label),
      items: g.services
        .filter((svc) => svc.packages.length > 0)
        .map((svc): ServiceItem => {
          const groupLabel = g.label;
          const groupLabelAr = sectionArMap.get(g.label);
          if (svc.packages.length !== 1) {
            return {
              id: svc.id,
              name: svc.name,
              nameAr: svc.translations?.ar?.name,
              description: svc.description ?? undefined,
              descriptionAr: svc.translations?.ar?.description,
              groupLabel,
              groupLabelAr,
              unsplashId: svc.unsplash_id ?? undefined,
              tiers: svc.packages.map((p) => ({
                label: p.name,
                labelAr: p.translations?.ar?.name,
                price: `${p.price} ${p.currency}`,
                numericPrice: p.price,
              })),
            };
          }
          const pkg = svc.packages[0];
          return {
            id: svc.id,
            name: svc.name,
            nameAr: svc.translations?.ar?.name,
            description: svc.description ?? undefined,
            descriptionAr: svc.translations?.ar?.description,
            groupLabel,
            groupLabelAr,
            price: pkg.note === "Starting from"
              ? `from ${pkg.price} ${pkg.currency}`
              : `${pkg.price} ${pkg.currency}`,
            numericPrice: pkg.price,
            note: pkg.note ?? undefined,
            unsplashId: svc.unsplash_id ?? undefined,
            icon: pkg.icon ?? undefined,
          };
        }),
    })),
  };
}

export async function fetchCatalog(): Promise<Category[]> {
  const [cats, sectionArMap] = await Promise.all([fetchApiCategories(), fetchSectionArMap()]);
  return cats.map((c) => apiToCategory(c, sectionArMap));
}

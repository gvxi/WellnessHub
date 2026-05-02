export const dynamic = "force-dynamic";

import { Suspense } from "react";
import { createClient } from "@supabase/supabase-js";
import Nav from "@/components/shared/Nav";
import Footer from "@/components/shared/Footer";
import FirstVisitGuard from "@/app/_components/FirstVisitGuard";
import ServiceCategory from "@/app/(public)/_sections/ServiceCategory";
import AdBanner from "@/app/(public)/_sections/AdBanner";
import { Skeleton } from "@/components/ui/skeleton";
import type { Category, ServiceItem, SubCategory } from "@/lib/services-data";
import type { ApiCategory, ApiAd, ApiGroup, ApiService, Translations } from "@/lib/supabase/types";
import { Sparkles } from "lucide-react";

// ─── Direct Supabase fetch (server-side, no HTTP round-trip) ─────────────────

function makeSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

async function fetchCategories(): Promise<ApiCategory[]> {
  const supabase = makeSupabase();
  const { data, error } = await supabase
    .from("categories")
    .select(`
      id, name, subtitle, unsplash_id, image_url, slug, display_order, translations,
      services (
        id, name, description, group_label, unsplash_id, display_order, translations,
        packages ( id, name, description, price, currency, note, icon, display_order, translations )
      )
    `)
    .order("display_order", { ascending: true });

  if (error || !data) return [];

  return data.map((cat) => {
    const services = [...(cat.services ?? [])].sort((a, b) => a.display_order - b.display_order);
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

    const groups: ApiGroup[] = Array.from(groupMap.entries()).map(([label, svcs]) => ({ label, services: svcs }));

    return {
      id: cat.id,
      name: cat.name,
      subtitle: cat.subtitle,
      unsplash_id: cat.unsplash_id,
      image_url: cat.image_url,
      slug: cat.slug,
      display_order: cat.display_order,
      translations: (cat.translations as Translations) ?? {},
      groups,
    };
  });
}

async function fetchSectionArMap(): Promise<Map<string, string>> {
  const supabase = makeSupabase();
  const { data } = await supabase
    .from("section_labels")
    .select("name, translations");
  const map = new Map<string, string>();
  for (const row of data ?? []) {
    const ar = (row.translations as { ar?: { name?: string } })?.ar?.name;
    if (ar) map.set(row.name, ar);
  }
  return map;
}

async function fetchAds(): Promise<ApiAd[]> {
  const supabase = makeSupabase();
  const { data, error } = await supabase
    .from("ads")
    .select("id, headline, subtitle, unsplash_id, image_url, badge_text, link_url, fullscreen_enabled, display_order, translations")
    .eq("is_active", true)
    .order("display_order", { ascending: true });

  if (error || !data) return [];

  return data.map((ad) => ({
    id: ad.id,
    headline: ad.headline,
    subtitle: ad.subtitle,
    unsplash_id: ad.unsplash_id,
    image_url: ad.image_url,
    badge_text: ad.badge_text,
    link_url: ad.link_url ?? null,
    fullscreen_enabled: ad.fullscreen_enabled ?? false,
    display_order: ad.display_order,
    translations: (ad.translations as Translations) ?? {},
  }));
}

// ─── Adapter ─────────────────────────────────────────────────────────────────

function apiToCategory(cat: ApiCategory, sectionArMap: Map<string, string>): Category {
  return {
    id: cat.slug ?? cat.id,
    title: cat.name,
    titleAr: cat.translations?.ar?.name,
    subtitle: cat.subtitle ?? "",
    subtitleAr: cat.translations?.ar?.subtitle,
    unsplashId: cat.unsplash_id ?? "",
    imageUrl: cat.image_url ?? undefined,
    subs: cat.groups.map((g) => {
      const sub: SubCategory = {
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
                imageUrl: svc.image_url ?? undefined,
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
              imageUrl: svc.image_url ?? undefined,
              icon: pkg.icon ?? undefined,
            };
          }),
      };
      return sub;
    }),
  };
}

// ─── Skeletons ────────────────────────────────────────────────────────────────

function ServiceCategorySkeleton() {
  return (
    <section>
      <Skeleton className="w-full min-h-[340px] md:min-h-[420px] rounded-none" />
      <div className="bg-light py-14 md:py-20 px-5 md:px-14 max-w-[1400px] mx-auto">
        <div className="grid md:grid-cols-2 gap-x-16 gap-y-12">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-3">
              <Skeleton className="h-3 w-1/3" />
              {Array.from({ length: 3 }).map((_, j) => (
                <div key={j} className="flex justify-between py-3 border-b border-dark/6">
                  <Skeleton className="h-3 w-1/2" />
                  <Skeleton className="h-3 w-12" />
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function AdBannerSkeleton() {
  return <Skeleton className="mx-4 md:mx-10 my-3 rounded-2xl min-h-[180px] md:min-h-[220px]" />;
}

// ─── Async content ────────────────────────────────────────────────────────────

async function LandingContent() {
  const [categories, ads, sectionArMap] = await Promise.all([fetchCategories(), fetchAds(), fetchSectionArMap()]);

  const [fitness, salon, advanced, nails] = categories.map((c) => apiToCategory(c, sectionArMap));
  const [adA, adB] = ads;

  if (!fitness) {
    return (
      <div className="flex flex-col items-center justify-center py-32 px-4 text-center">
        <div className="w-16 h-16 rounded-full bg-dark/5 flex items-center justify-center mb-4">
          <Sparkles size={28} className="text-dark/20" />
        </div>
        <p className="text-sm font-medium text-dark/40">Services coming soon</p>
        <p className="text-xs text-dark/30 mt-1">Check back shortly</p>
      </div>
    );
  }

  return (
    <>
      {fitness  && <ServiceCategory category={fitness} />}
      {adA      && <AdBanner ad={adA} />}
      {salon    && <ServiceCategory category={salon} />}
      {advanced && <ServiceCategory category={advanced} />}
      {adB      && <AdBanner ad={adB} />}
      {nails    && <ServiceCategory category={nails} />}
    </>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function Home() {
  return (
    <main className="overflow-x-hidden w-full max-w-full">
      <FirstVisitGuard />
      <Nav />
      <Suspense
        fallback={
          <>
            <ServiceCategorySkeleton />
            <AdBannerSkeleton />
            <ServiceCategorySkeleton />
            <ServiceCategorySkeleton />
            <AdBannerSkeleton />
            <ServiceCategorySkeleton />
          </>
        }
      >
        <LandingContent />
      </Suspense>
      <Footer />
    </main>
  );
}

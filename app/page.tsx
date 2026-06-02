export const dynamic = "force-dynamic";

import { Suspense } from "react";
import { createClient } from "@supabase/supabase-js";
import Nav from "@/components/shared/Nav";
import Footer from "@/components/shared/Footer";
import FirstVisitGuard from "@/app/_components/FirstVisitGuard";
import ServiceCategory from "@/app/(public)/_sections/ServiceCategory";
import AdBanner from "@/app/(public)/_sections/AdBanner";
import { Skeleton } from "@/components/ui/skeleton";
import type { ApiAd, Translations } from "@/lib/supabase/types";
import { fetchCatalog } from "@/lib/supabase/catalog";
import { Sparkles } from "lucide-react";

function makeSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
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
  const [categories, ads] = await Promise.all([fetchCatalog(), fetchAds()]);

  const [fitness, salon, advanced, nails] = categories;
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

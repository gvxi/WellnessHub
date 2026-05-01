import { Suspense } from "react";
import Nav from "@/components/shared/Nav";
import Footer from "@/components/shared/Footer";
import FirstVisitGuard from "@/app/_components/FirstVisitGuard";
import ServiceCategory from "@/app/(public)/_sections/ServiceCategory";
import AdBanner from "@/app/(public)/_sections/AdBanner";
import { Skeleton } from "@/components/ui/skeleton";
import type { Category, ServiceItem, SubCategory } from "@/lib/services-data";
import type { ApiCategory, ApiAd } from "@/lib/supabase/types";
import { Sparkles } from "lucide-react";

// ─── Adapters ─────────────────────────────────────────────────────────────────

function apiToCategory(cat: ApiCategory): Category {
  return {
    id: cat.slug ?? cat.id,
    title: cat.name,
    subtitle: cat.subtitle ?? "",
    unsplashId: cat.unsplash_id ?? "",
    imageUrl: cat.image_url ?? undefined,
    subs: cat.groups.map((g) => {
      const sub: SubCategory = {
        title: g.label,
        items: g.services
          .filter((svc) => svc.packages.length > 0)
          .map((svc): ServiceItem => {
            if (svc.packages.length !== 1) {
              return {
                id: svc.id,
                name: svc.name,
                description: svc.description ?? undefined,
                tiers: svc.packages.map((p) => ({
                  label: p.name,
                  price: `${p.price} ${p.currency}`,
                  numericPrice: p.price,
                })),
              };
            }
            const pkg = svc.packages[0];
            return {
              id: svc.id,
              name: svc.name,
              description: svc.description ?? undefined,
              price: pkg.note === "Starting from"
                ? `from ${pkg.price} ${pkg.currency}`
                : `${pkg.price} ${pkg.currency}`,
              numericPrice: pkg.price,
              note: pkg.note ?? undefined,
              unsplashId: svc.unsplash_id ?? undefined,
              icon: pkg.icon ?? undefined,
            };
          }),
      };
      return sub;
    }),
  };
}

// ─── Skeleton placeholders ─────────────────────────────────────────────────────

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

// ─── Async content ─────────────────────────────────────────────────────────────

async function LandingContent() {
  const apiBase =
    process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000/api";

  const [categoriesRaw, adsRaw] = await Promise.all([
    fetch(`${apiBase}/categories`, { next: { revalidate: 60 } })
      .then((r) => r.json())
      .catch(() => []),
    fetch(`${apiBase}/ads`, { next: { revalidate: 60 } })
      .then((r) => r.json())
      .catch(() => []),
  ]);

  const categories: ApiCategory[] = Array.isArray(categoriesRaw) ? categoriesRaw : [];
  const ads: ApiAd[] = Array.isArray(adsRaw) ? adsRaw : [];

  const [fitness, salon, advanced, nails] = categories.map(apiToCategory);
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
      {fitness && <ServiceCategory category={fitness} />}
      {adA && <AdBanner ad={adA} />}
      {salon && <ServiceCategory category={salon} />}
      {advanced && <ServiceCategory category={advanced} />}
      {adB && <AdBanner ad={adB} />}
      {nails && <ServiceCategory category={nails} />}
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

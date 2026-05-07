"use client";

import { useCallback, useEffect, useState } from "react";
import { Search, Eye, EyeOff, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { resolveImage } from "@/lib/utils";
import { useLang } from "@/lib/lang-context";
import { Skeleton } from "@/components/ui/skeleton";
import type { EmployeePermissions, Translations } from "@/lib/supabase/types";

type InnerTab = "categories" | "products";

interface Props {
  permissions: EmployeePermissions;
}

type CategoryRow = {
  id: string;
  name: string;
  subtitle: string | null;
  unsplash_id: string | null;
  image_url: string | null;
  display_order: number;
  translations: Translations;
};

type PackageRow = {
  id: string;
  name: string;
  price: number;
  currency: string;
  is_active: boolean;
  translations: Translations;
};

type ServiceRow = {
  id: string;
  name: string;
  description: string | null;
  group_label: string | null;
  unsplash_id: string | null;
  image_url: string | null;
  is_active: boolean;
  category_id: string | null;
  translations: Translations;
  categories: { name: string; translations: Translations } | null;
  packages: PackageRow[];
};

type SortKey = "name" | "order";
type ActiveFilter = "all" | "active" | "hidden";

function translated(name: string, translations: Translations | null | undefined, isRTL: boolean): string {
  if (isRTL && translations?.ar?.name) return translations.ar.name;
  return name;
}

export default function PosServicesTab({ permissions }: Props) {
  const { t, isRTL } = useLang();
  const [innerTab, setInnerTab] = useState<InnerTab>("categories");
  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const [services, setServices] = useState<ServiceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState<string>("all");
  const [sort, setSort] = useState<SortKey>("order");
  const [activeFilter, setActiveFilter] = useState<ActiveFilter>("all");

  const loadCategories = useCallback(async () => {
    const res = await fetch("/api/pos/categories");
    if (res.ok) setCategories(await res.json());
  }, []);

  const loadServices = useCallback(async () => {
    const res = await fetch("/api/pos/services");
    if (res.ok) setServices(await res.json());
  }, []);

  useEffect(() => {
    setLoading(true);
    Promise.all([loadCategories(), loadServices()]).finally(() => setLoading(false));
  }, [loadCategories, loadServices]);

  async function toggleServiceActive(svc: ServiceRow) {
    if (!permissions.can_edit_services) return;
    setTogglingId(svc.id);
    try {
      await fetch(`/api/pos/services/${svc.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: !svc.is_active }),
      });
      await loadServices();
    } finally {
      setTogglingId(null);
    }
  }

  // Filtered + sorted services
  const filteredServices = services
    .filter((svc) => {
      if (catFilter !== "all" && svc.category_id !== catFilter) return false;
      if (activeFilter === "active" && !svc.is_active) return false;
      if (activeFilter === "hidden" && svc.is_active) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        const nameAr = svc.translations?.ar?.name ?? "";
        return svc.name.toLowerCase().includes(q) || nameAr.toLowerCase().includes(q);
      }
      return true;
    })
    .sort((a, b) => {
      if (sort === "name") return a.name.localeCompare(b.name);
      return 0; // already ordered by display_order from API
    });

  const INNER_TABS: { id: InnerTab; label: string }[] = [
    { id: "categories", label: t("pos.tab_categories") },
    { id: "products",   label: t("pos.tab_products") },
  ];

  const ACTIVE_FILTERS: { id: ActiveFilter; label: string }[] = [
    { id: "all",    label: t("pos.filter_all") },
    { id: "active", label: t("pos.filter_active") },
    { id: "hidden", label: t("pos.filter_inactive") },
  ];

  return (
    <div className="h-full flex flex-col max-w-6xl mx-auto px-4 md:px-6">
      {/* Mini-tabs */}
      <div className="flex gap-1 pt-4 pb-3">
        {INNER_TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setInnerTab(tab.id)}
            className={cn(
              "px-4 py-1.5 rounded-full text-xs font-semibold transition-colors",
              innerTab === tab.id
                ? "bg-primary text-light"
                : "bg-dark/6 text-dark/55 hover:bg-dark/10"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Products controls */}
      {innerTab === "products" && (
        <div className="space-y-2 pb-2">
          {/* Search */}
          <div className="relative">
            <Search size={13} className="absolute start-3 top-1/2 -translate-y-1/2 text-dark/35 pointer-events-none" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("pos.search_placeholder")}
              className="w-full bg-dark/5 rounded-xl ps-8 pe-8 py-2.5 text-sm text-dark outline-none placeholder:text-dark/30"
            />
            {search && (
              <button onClick={() => setSearch("")} className="absolute inset-y-0 end-3 flex items-center text-dark/35">
                <X size={13} />
              </button>
            )}
          </div>

          {/* Category filter + sort + active filter row */}
          <div className="flex gap-2 overflow-x-auto pb-0.5">
            {/* Category pills */}
            <button
              onClick={() => setCatFilter("all")}
              className={cn(
                "flex-none px-3 py-1.5 rounded-full text-xs font-semibold transition-colors",
                catFilter === "all" ? "bg-secondary text-light" : "bg-dark/6 text-dark/55 hover:bg-dark/10"
              )}
            >
              {t("pos.filter_category")}
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setCatFilter(catFilter === cat.id ? "all" : cat.id)}
                className={cn(
                  "flex-none px-3 py-1.5 rounded-full text-xs font-semibold transition-colors",
                  catFilter === cat.id ? "bg-secondary text-light" : "bg-dark/6 text-dark/55 hover:bg-dark/10"
                )}
              >
                {translated(cat.name, cat.translations, isRTL)}
              </button>
            ))}

            {/* Divider */}
            <div className="w-px bg-dark/10 flex-none self-stretch mx-1" />

            {/* Sort toggle */}
            <button
              onClick={() => setSort(sort === "order" ? "name" : "order")}
              className="flex-none px-3 py-1.5 rounded-full text-xs font-semibold bg-dark/6 text-dark/55 hover:bg-dark/10 transition-colors"
            >
              {sort === "name" ? t("pos.sort_name") : t("pos.sort_order")}
            </button>

            {/* Divider */}
            <div className="w-px bg-dark/10 flex-none self-stretch mx-1" />

            {/* Active/hidden filter */}
            {ACTIVE_FILTERS.map((f) => (
              <button
                key={f.id}
                onClick={() => setActiveFilter(f.id)}
                className={cn(
                  "flex-none px-3 py-1.5 rounded-full text-xs font-semibold transition-colors",
                  activeFilter === f.id ? "bg-dark/20 text-dark" : "bg-dark/6 text-dark/55 hover:bg-dark/10"
                )}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto pb-6">
        {loading ? (
          <div className="space-y-2 pt-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-16 rounded-2xl" />
            ))}
          </div>
        ) : innerTab === "categories" ? (
          <div className="space-y-2">
            {categories.map((cat) => {
              const imgUrl = resolveImage(cat.image_url, cat.unsplash_id, 300);
              return (
                <div key={cat.id} className="bg-white rounded-2xl border border-dark/6 shadow-sm overflow-hidden flex items-center gap-3 px-3 py-2.5">
                  {imgUrl ? (
                    <img
                      src={imgUrl}
                      alt={cat.name}
                      className="w-12 h-12 rounded-xl object-cover flex-none"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-xl bg-dark/8 flex-none" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-dark truncate">
                      {translated(cat.name, cat.translations, isRTL)}
                    </p>
                    {cat.subtitle && (
                      <p className="text-xs text-dark/40 truncate mt-0.5">
                        {isRTL && cat.translations?.ar?.subtitle ? cat.translations.ar.subtitle : cat.subtitle}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : filteredServices.length === 0 ? (
          <div className="pt-16 text-center text-sm text-dark/30">{t("pos.no_results")}</div>
        ) : (
          <div className="space-y-2">
            {filteredServices.map((svc) => {
              const imgUrl = resolveImage(svc.image_url, svc.unsplash_id, 200);
              const displayName = translated(svc.name, svc.translations, isRTL);
              const catName = svc.categories
                ? translated(svc.categories.name, svc.categories.translations, isRTL)
                : null;

              return (
                <div
                  key={svc.id}
                  className={cn(
                    "bg-white rounded-2xl border border-dark/6 shadow-sm overflow-hidden transition-opacity",
                    !svc.is_active && "opacity-50"
                  )}
                >
                  <div className="flex items-center gap-3 px-3 py-2.5">
                    {/* Thumbnail */}
                    {imgUrl ? (
                      <img
                        src={imgUrl}
                        alt={svc.name}
                        className="w-10 h-10 rounded-lg object-cover flex-none"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-dark/8 flex-none" />
                    )}

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold text-dark truncate">
                          {displayName}
                        </p>
                        {!svc.is_active && (
                          <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-red-100 text-red-500 uppercase tracking-wide flex-none">
                            {t("pos.visibility_hidden")}
                          </span>
                        )}
                      </div>
                      {catName && (
                        <p className="text-xs text-secondary/70 font-medium truncate">{catName}</p>
                      )}
                      {svc.description && (
                        <p className="text-[10px] text-dark/35 truncate mt-0.5">
                          {isRTL && svc.translations?.ar?.description ? svc.translations.ar.description : svc.description}
                        </p>
                      )}
                    </div>

                    {permissions.can_edit_services && (
                      <button
                        onClick={() => toggleServiceActive(svc)}
                        disabled={togglingId === svc.id}
                        className="flex-none p-1.5 rounded-lg text-dark/30 hover:text-dark/60 hover:bg-dark/5 transition-colors disabled:opacity-40"
                        title={svc.is_active ? t("pos.filter_active") : t("pos.filter_inactive")}
                      >
                        {svc.is_active ? <Eye size={14} /> : <EyeOff size={14} />}
                      </button>
                    )}
                  </div>

                  {/* Price packages */}
                  {svc.packages.length > 0 && (
                    <div className="border-t border-dark/6 px-3 py-2 flex flex-wrap gap-1.5">
                      {svc.packages.map((pkg) => (
                        <span
                          key={pkg.id}
                          className={cn(
                            "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-primary/8 text-dark/70",
                            !pkg.is_active && "opacity-40"
                          )}
                        >
                          <span className="font-bold text-primary text-sm">{pkg.price}</span>
                          <span className="text-dark/40 text-[10px]">{pkg.currency}</span>
                          <span className="text-dark/50">·</span>
                          <span>{translated(pkg.name, pkg.translations, isRTL)}</span>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

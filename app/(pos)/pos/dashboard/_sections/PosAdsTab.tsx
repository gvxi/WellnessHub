"use client";

import { useCallback, useEffect, useState } from "react";
import { ToggleLeft, ToggleRight, ImageOff, Edit2, Plus, Languages, Loader2, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { resolveImage } from "@/lib/utils";
import { useLang } from "@/lib/lang-context";
import { Skeleton } from "@/components/ui/skeleton";
import EditSheet, { type FieldDef } from "@/app/(admin)/zw0/dashboard/_components/EditSheet";
import ConfirmSheet from "@/app/(admin)/zw0/dashboard/_components/ConfirmSheet";
import type { EmployeePermissions, Translations } from "@/lib/supabase/types";

interface Props {
  permissions: EmployeePermissions;
}

type AdRow = {
  id: string; headline: string; subtitle: string | null;
  image_url: string | null; unsplash_id: string | null;
  badge_text: string | null; link_url: string | null;
  is_active: boolean; fullscreen_enabled: boolean; display_order: number;
  translations: Translations | null;
};

const AD_FIELDS: FieldDef[] = [
  { key: "headline",   label: "Headline",            required: true, placeholder: "e.g. Exclusive Offers",            translatable: true },
  { key: "subtitle",   label: "Subtitle",            type: "textarea", placeholder: "e.g. Book now and save",         translatable: true },
  { key: "link_url",   label: "Link URL",                             placeholder: "https://…",                       translatable: true },
  { key: "image_url",  label: "Ad Image",            type: "image",  uploadFolder: "ads" },
  { key: "unsplash_id",label: "Unsplash Fallback ID",                 placeholder: "e.g. photo-1581009146145-b5ef050c2e1e" },
  { key: "badge_text", label: "Badge Text",                           placeholder: "e.g. Ad",                         translatable: true },
];

function arValues(translations: Translations | null, keys: string[]): Record<string, string> {
  const ar = (translations as any)?.ar ?? {};
  const out: Record<string, string> = {};
  for (const k of keys) out[`${k}_ar`] = ar[k] ?? "";
  return out;
}

function buildTranslations(values: Record<string, string>, keys: string[]): Translations {
  const ar: Record<string, string> = {};
  for (const k of keys) {
    const v = values[`${k}_ar`];
    if (v?.trim()) ar[k] = v.trim();
  }
  return Object.keys(ar).length ? { ar } : {} as Translations;
}

export default function PosAdsTab({ permissions }: Props) {
  const { t, isRTL } = useLang();
  const canEdit = permissions.tab_ads === "enabled";
  const [ads, setAds] = useState<AdRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState<string | null>(null);
  const [editing, setEditing] = useState<AdRow | null>(null);
  const [adding, setAdding] = useState(false);
  const [deleting, setDeleting] = useState<AdRow | null>(null);
  const [query, setQuery] = useState("");
  const [filterActive, setFilterActive] = useState<"all" | "active" | "inactive">("all");

  const filteredAds = ads
    .filter((ad) => filterActive === "all" ? true : filterActive === "active" ? ad.is_active : !ad.is_active)
    .filter((ad) => {
      const q = query.toLowerCase().trim();
      return !q || ad.headline.toLowerCase().includes(q) || (ad.subtitle ?? "").toLowerCase().includes(q);
    });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/pos/ads");
      if (res.ok) setAds(await res.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function toggleActive(ad: AdRow) {
    setToggling(ad.id);
    try {
      await fetch(`/api/pos/ads/${ad.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: !ad.is_active }),
      });
      setAds((prev) => prev.map((a) => a.id === ad.id ? { ...a, is_active: !a.is_active } : a));
    } finally {
      setToggling(null);
    }
  }

  async function saveAd(values: Record<string, string>) {
    const { headline, subtitle, link_url, image_url, unsplash_id, badge_text } = values;
    const translations = buildTranslations(values, ["headline", "subtitle", "link_url", "badge_text"]);
    const payload = { headline, subtitle, link_url, image_url, unsplash_id, badge_text, translations };

    if (editing) {
      const res = await fetch(`/api/pos/ads/${editing.id}`, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const updated = await res.json();
      setAds((prev) => prev.map((a) => a.id === editing.id ? { ...a, ...updated } : a));
    } else {
      const res = await fetch("/api/pos/ads", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...payload, display_order: ads.length }),
      });
      const created = await res.json();
      setAds((prev) => [...prev, created]);
    }
  }

  async function deleteAd() {
    if (!deleting) return;
    await fetch(`/api/pos/ads/${deleting.id}`, { method: "DELETE" });
    setAds((prev) => prev.filter((a) => a.id !== deleting.id));
  }

  const sheetOpen = editing !== null || adding;
  const editInitialValues = editing ? {
    headline: editing.headline,
    subtitle: editing.subtitle ?? "",
    link_url: editing.link_url ?? "",
    image_url: editing.image_url ?? "",
    unsplash_id: editing.unsplash_id ?? "",
    badge_text: editing.badge_text ?? "",
    ...arValues(editing.translations, ["headline", "subtitle", "link_url", "badge_text"]),
  } : undefined;

  return (
    <div className="h-full flex flex-col max-w-6xl mx-auto px-4 md:px-6 pt-4">
      {canEdit && (
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => { setEditing(null); setAdding(true); }}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl border border-dashed border-primary/30 text-primary text-xs font-medium hover:bg-primary/4 transition-colors"
          >
            <Plus size={14} />
            {t("admin.add_ad")}
          </button>
        </div>
      )}

      {/* Search + filter */}
      {ads.length > 3 && (
        <div className="flex gap-2 mb-3">
          <div className="relative flex-1">
            <Search size={13} className="absolute start-3 top-1/2 -translate-y-1/2 text-dark/30 pointer-events-none" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("admin.search_ads")}
              className="w-full bg-dark/[0.04] border border-dark/8 rounded-xl ps-9 pe-8 py-2.5 text-xs text-dark placeholder:text-dark/30 outline-none"
            />
            {query && (
              <button onClick={() => setQuery("")} className="absolute end-3 top-1/2 -translate-y-1/2 text-dark/30">
                <X size={13} />
              </button>
            )}
          </div>
          <select
            value={filterActive}
            onChange={(e) => setFilterActive(e.target.value as "all" | "active" | "inactive")}
            className="bg-dark/[0.04] border border-dark/8 rounded-xl px-3 py-2.5 text-xs text-dark/70 outline-none shrink-0"
          >
            <option value="all">{t("admin.filter_all")}</option>
            <option value="active">{t("admin.filter_active")}</option>
            <option value="inactive">{t("admin.filter_inactive")}</option>
          </select>
        </div>
      )}

      <div className="flex-1 overflow-y-auto pb-6">
        {loading ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-36 rounded-2xl" />
            ))}
          </div>
        ) : filteredAds.length === 0 ? (
          <div className="pt-16 text-center text-sm text-dark/30">{t("pos.no_ads")}</div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {filteredAds.map((ad) => {
              const imgUrl = resolveImage(ad.image_url, ad.unsplash_id, 400);
              return (
                <div key={ad.id} className="bg-white rounded-2xl border border-dark/6 shadow-sm overflow-hidden">
                  <div className="relative h-28 bg-dark/5">
                    {imgUrl ? (
                      <img src={imgUrl} alt={ad.headline} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ImageOff size={20} className="text-dark/20" />
                      </div>
                    )}
                    <span className={cn(
                      "absolute top-2 end-2 px-2 py-0.5 rounded-full text-[10px] font-semibold",
                      ad.is_active ? "bg-emerald-500 text-white" : "bg-dark/20 text-dark/60"
                    )}>
                      {ad.is_active ? t("pos.active") : t("pos.inactive")}
                    </span>
                    {canEdit && (
                      <button
                        onClick={() => { setAdding(false); setEditing(ad); }}
                        className="absolute top-2 start-2 w-7 h-7 rounded-lg bg-dark/60 flex items-center justify-center hover:bg-dark/80 transition-colors"
                      >
                        <Edit2 size={12} className="text-white" />
                      </button>
                    )}
                  </div>

                  <div className="px-3 py-3">
                    <p className="text-sm font-semibold text-dark truncate">
                      {isRTL && (ad.translations as any)?.ar?.headline ? (ad.translations as any).ar.headline : ad.headline}
                    </p>
                    {ad.subtitle && (
                      <p className="text-xs text-dark/40 truncate mt-0.5">
                        {isRTL && (ad.translations as any)?.ar?.subtitle ? (ad.translations as any).ar.subtitle : ad.subtitle}
                      </p>
                    )}

                    <div className="flex items-center gap-2 mt-2.5">
                      <button
                        disabled={toggling === ad.id}
                        onClick={() => toggleActive(ad)}
                        className={cn(
                          "flex items-center gap-1.5 text-xs font-medium transition-colors disabled:opacity-40",
                          ad.is_active ? "text-emerald-600" : "text-dark/40"
                        )}
                      >
                        {ad.is_active ? <ToggleRight size={15} /> : <ToggleLeft size={15} />}
                        {ad.is_active ? t("pos.active") : t("pos.inactive")}
                      </button>
                      {canEdit && (
                        <button
                          onClick={() => setDeleting(ad)}
                          className="ms-auto text-xs text-red-400 hover:text-red-600 transition-colors"
                        >
                          {t("admin.delete")}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {canEdit && (
        <>
          <EditSheet
            open={sheetOpen}
            title={editing ? t("admin.edit_ad") : t("admin.add_ad")}
            fields={AD_FIELDS}
            initialValues={editInitialValues}
            onClose={() => { setEditing(null); setAdding(false); }}
            onSave={saveAd}
            onDelete={editing ? () => setDeleting(editing) : undefined}
          />
          <ConfirmSheet
            open={!!deleting}
            message={`${t("admin.delete")} "${deleting?.headline}"?`}
            onConfirm={deleteAd}
            onClose={() => setDeleting(null)}
          />
        </>
      )}
    </div>
  );
}

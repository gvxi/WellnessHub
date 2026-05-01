"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ToggleLeft, ToggleRight, ImageOff, Edit2, Plus, Maximize2, Minimize2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import EditSheet, { type FieldDef } from "../_components/EditSheet";
import ConfirmSheet from "../_components/ConfirmSheet";
import { resolveImage } from "@/lib/utils";

type Translations = Record<string, Record<string, string>>;

type AdRow = {
  id: string; headline: string; subtitle: string | null;
  unsplash_id: string | null; image_url: string | null;
  badge_text: string | null; is_active: boolean;
  fullscreen_enabled: boolean; display_order: number;
  translations: Translations;
};

const AD_FIELDS: FieldDef[] = [
  { key: "headline",    label: "Headline", required: true, placeholder: "e.g. Exclusive Offers", translatable: true },
  { key: "subtitle",   label: "Subtitle",                  placeholder: "e.g. Book now and save", translatable: true },
  { key: "image_url",  label: "Ad Image", type: "image",   uploadFolder: "ads" },
  { key: "unsplash_id",label: "Unsplash Fallback ID",       placeholder: "e.g. photo-1581009146145-b5ef050c2e1e" },
  { key: "badge_text", label: "Badge Text",                 placeholder: "e.g. Ad", translatable: true },
];

function arValues(translations: Translations, keys: string[]): Record<string, string> {
  const ar = translations?.ar ?? {};
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
  return Object.keys(ar).length ? { ar } : {};
}

export default function AdsTab() {
  const [ads, setAds] = useState<AdRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState<string | null>(null);
  const [editing, setEditing] = useState<AdRow | null>(null);
  const [adding, setAdding] = useState(false);
  const [deleting, setDeleting] = useState<AdRow | null>(null);

  useEffect(() => {
    fetch("/api/admin/ads")
      .then((r) => r.json())
      .then((data) => { setAds(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  async function toggleActive(ad: AdRow) {
    setToggling(ad.id);
    await fetch(`/api/admin/ads/${ad.id}`, {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_active: !ad.is_active }),
    });
    setAds((prev) => prev.map((a) => a.id === ad.id ? { ...a, is_active: !a.is_active } : a));
    setToggling(null);
  }

  async function toggleFullscreen(ad: AdRow) {
    await fetch(`/api/admin/ads/${ad.id}`, {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fullscreen_enabled: !ad.fullscreen_enabled }),
    });
    setAds((prev) => prev.map((a) => a.id === ad.id ? { ...a, fullscreen_enabled: !a.fullscreen_enabled } : a));
  }

  async function saveAd(values: Record<string, string>) {
    const { headline, subtitle, image_url, unsplash_id, badge_text } = values;
    const translations = buildTranslations(values, ["headline", "subtitle", "badge_text"]);
    const payload = { headline, subtitle, image_url, unsplash_id, badge_text, translations };

    if (editing) {
      const res = await fetch(`/api/admin/ads/${editing.id}`, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const updated = await res.json();
      setAds((prev) => prev.map((a) => a.id === editing.id ? { ...a, ...updated } : a));
    } else {
      const res = await fetch("/api/admin/ads", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...payload, display_order: ads.length }),
      });
      const created = await res.json();
      setAds((prev) => [...prev, created]);
    }
  }

  async function deleteAd() {
    if (!deleting) return;
    await fetch(`/api/admin/ads/${deleting.id}`, { method: "DELETE" });
    setAds((prev) => prev.filter((a) => a.id !== deleting.id));
  }

  function openEdit(ad: AdRow) { setAdding(false); setEditing(ad); }

  const sheetOpen = editing !== null || adding;

  const editInitialValues = editing ? {
    headline: editing.headline,
    subtitle: editing.subtitle ?? "",
    image_url: editing.image_url ?? "",
    unsplash_id: editing.unsplash_id ?? "",
    badge_text: editing.badge_text ?? "",
    ...arValues(editing.translations, ["headline", "subtitle", "badge_text"]),
  } : undefined;

  return (
    <div className="px-4 py-5 pb-6 space-y-4">
      <button
        onClick={() => { setEditing(null); setAdding(true); }}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl border border-dashed border-primary/30 text-primary text-xs font-medium hover:bg-primary/4 transition-colors"
      >
        <Plus size={14} />
        Add Ad
      </button>

      {loading ? (
        <>
          <Skeleton className="h-36 rounded-2xl" />
          <Skeleton className="h-36 rounded-2xl" />
        </>
      ) : ads.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <ImageOff size={32} className="text-dark/20 mb-3" />
          <p className="text-sm text-dark/40">No ads yet</p>
        </div>
      ) : (
        <motion.div
          variants={{ show: { transition: { staggerChildren: 0.06 } } }}
          initial="hidden"
          animate="show"
          className="space-y-3"
        >
          {ads.map((ad) => (
            <motion.div
              key={ad.id}
              variants={{ hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } }}
              className="rounded-2xl overflow-hidden"
            >
              {/* Preview banner */}
              <div
                className="relative min-h-[130px] flex items-end"
                style={(() => {
                  const img = resolveImage(ad.image_url, ad.unsplash_id, 600);
                  return img
                    ? { backgroundImage: `url(${img})`, backgroundSize: "cover", backgroundPosition: "center" }
                    : { background: "linear-gradient(135deg, #5A0F1B, #8E6A94)" };
                })()}
              >
                <div className="absolute inset-0 bg-primary/70" />
                <div className="relative z-10 px-4 py-3">
                  <p className="text-xs font-bold text-light">{ad.headline}</p>
                  {ad.subtitle && <p className="text-[10px] text-light/60 mt-0.5">{ad.subtitle}</p>}
                  {/* Show AR translation preview */}
                  {ad.translations?.ar?.headline && (
                    <p className="text-[10px] text-accent/70 mt-1" dir="rtl">{ad.translations.ar.headline}</p>
                  )}
                </div>
                {ad.badge_text && (
                  <span className="absolute top-3 right-3 text-[9px] uppercase tracking-widest text-light/40 border border-light/20 px-1.5 py-0.5 rounded-full z-10">
                    {ad.badge_text}
                  </span>
                )}
                {/* AR indicator dot */}
                {ad.translations?.ar?.headline && (
                  <span className="absolute top-3 left-3 text-[9px] font-bold text-accent bg-dark/40 px-1.5 py-0.5 rounded-full z-10">ع</span>
                )}
              </div>

              {/* Controls */}
              <div className="flex items-center justify-between px-4 py-3 bg-dark/[0.03]">
                <button
                  disabled={toggling === ad.id}
                  onClick={() => toggleActive(ad)}
                  className="flex items-center gap-1.5 text-xs font-medium disabled:opacity-50"
                >
                  {ad.is_active
                    ? <><ToggleRight size={20} className="text-emerald-500" /><span className="text-emerald-600">Active</span></>
                    : <><ToggleLeft size={20} className="text-dark/30" /><span className="text-dark/40">Off</span></>
                  }
                </button>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggleFullscreen(ad)}
                    className="flex items-center gap-1 text-xs font-medium"
                    title={ad.fullscreen_enabled ? "Disable fullscreen" : "Enable fullscreen on tap"}
                  >
                    {ad.fullscreen_enabled
                      ? <><Maximize2 size={14} className="text-primary" /><span className="text-primary">Fullscreen</span></>
                      : <><Minimize2 size={14} className="text-dark/30" /><span className="text-dark/30">Tap: off</span></>
                    }
                  </button>
                  <button
                    onClick={() => openEdit(ad)}
                    className="w-7 h-7 rounded-lg bg-dark/5 flex items-center justify-center"
                  >
                    <Edit2 size={13} className="text-dark/50" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}

      <EditSheet
        open={sheetOpen}
        title={editing ? "Edit Ad" : "New Ad"}
        fields={AD_FIELDS}
        initialValues={editInitialValues}
        onClose={() => { setEditing(null); setAdding(false); }}
        onSave={saveAd}
        onDelete={editing ? () => { setEditing(null); setAdding(false); setDeleting(editing); } : undefined}
      />

      <ConfirmSheet
        open={deleting !== null}
        message={`Delete "${deleting?.headline}"? This cannot be undone.`}
        onConfirm={deleteAd}
        onClose={() => setDeleting(null)}
      />
    </div>
  );
}

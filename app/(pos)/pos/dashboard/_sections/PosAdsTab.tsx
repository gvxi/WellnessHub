"use client";

import { useCallback, useEffect, useState } from "react";
import { ToggleLeft, ToggleRight, ImageOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { resolveImage } from "@/lib/utils";
import type { EmployeePermissions } from "@/lib/supabase/types";

interface Props {
  permissions: EmployeePermissions;
}

type AdRow = {
  id: string; headline: string; subtitle: string | null;
  image_url: string | null; unsplash_id: string | null;
  is_active: boolean; fullscreen_enabled: boolean; display_order: number;
};

export default function PosAdsTab({ permissions }: Props) {
  const [ads, setAds] = useState<AdRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState<string | null>(null);

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
    if (!permissions.can_edit_ads) return;
    setToggling(ad.id);
    try {
      await fetch(`/api/pos/ads/${ad.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: !ad.is_active }),
      });
      await load();
    } finally {
      setToggling(null);
    }
  }

  return (
    <div className="h-full flex flex-col max-w-6xl mx-auto px-4 md:px-6 pt-4">
      {!permissions.can_edit_ads && (
        <p className="text-xs text-dark/40 mb-3 bg-dark/4 rounded-xl px-3 py-2">
          Read-only — your account doesn&apos;t have edit permissions for ads.
        </p>
      )}

      <div className="flex-1 overflow-y-auto pb-6">
        {loading ? (
          <div className="pt-12 text-center text-sm text-dark/35">Loading…</div>
        ) : ads.length === 0 ? (
          <div className="pt-16 text-center text-sm text-dark/30">No ads found</div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {ads.map((ad) => {
              const imgUrl = resolveImage(ad.image_url, ad.unsplash_id, 400);
              return (
                <div key={ad.id} className="bg-white rounded-2xl border border-dark/6 shadow-sm overflow-hidden">
                  {/* Thumbnail */}
                  <div className="relative h-28 bg-dark/5">
                    {imgUrl ? (
                      <img src={imgUrl} alt={ad.headline} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ImageOff size={20} className="text-dark/20" />
                      </div>
                    )}
                    <span
                      className={cn(
                        "absolute top-2 end-2 px-2 py-0.5 rounded-full text-[10px] font-semibold",
                        ad.is_active ? "bg-emerald-500 text-white" : "bg-dark/20 text-dark/60"
                      )}
                    >
                      {ad.is_active ? "Active" : "Inactive"}
                    </span>
                  </div>

                  <div className="px-3 py-3">
                    <p className="text-sm font-semibold text-dark truncate">{ad.headline}</p>
                    {ad.subtitle && (
                      <p className="text-xs text-dark/40 truncate mt-0.5">{ad.subtitle}</p>
                    )}

                    {permissions.can_edit_ads && (
                      <button
                        disabled={toggling === ad.id}
                        onClick={() => toggleActive(ad)}
                        className={cn(
                          "mt-2.5 flex items-center gap-1.5 text-xs font-medium transition-colors disabled:opacity-40",
                          ad.is_active ? "text-emerald-600" : "text-dark/40"
                        )}
                      >
                        {ad.is_active
                          ? <ToggleRight size={15} />
                          : <ToggleLeft size={15} />
                        }
                        {ad.is_active ? "Active" : "Inactive"}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

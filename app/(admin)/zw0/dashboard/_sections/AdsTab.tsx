"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ToggleLeft, ToggleRight, ImageOff } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

type AdRow = {
  id: string;
  headline: string;
  subtitle: string | null;
  unsplash_id: string | null;
  badge_text: string | null;
  is_active: boolean;
  display_order: number;
};

export default function AdsTab() {
  const [ads, setAds] = useState<AdRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/ads")
      .then((r) => r.json())
      .then((data) => { setAds(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  async function toggleActive(ad: AdRow) {
    setToggling(ad.id);
    await fetch(`/api/admin/ads/${ad.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_active: !ad.is_active }),
    });
    setAds((prev) => prev.map((a) => (a.id === ad.id ? { ...a, is_active: !a.is_active } : a)));
    setToggling(null);
  }

  return (
    <div className="px-4 py-5 pb-6 space-y-4">
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
              {/* Ad preview banner */}
              <div
                className="relative min-h-[130px] flex items-end"
                style={
                  ad.unsplash_id
                    ? {
                        backgroundImage: `url(https://images.unsplash.com/${ad.unsplash_id}?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=60&w=600)`,
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                      }
                    : { background: "linear-gradient(135deg, #5A0F1B, #8E6A94)" }
                }
              >
                <div className="absolute inset-0 bg-primary/70" />
                <div className="relative z-10 px-4 py-3">
                  <p className="text-xs font-bold text-light">{ad.headline}</p>
                  {ad.subtitle && <p className="text-[10px] text-light/60 mt-0.5">{ad.subtitle}</p>}
                </div>
                {ad.badge_text && (
                  <span className="absolute top-3 right-3 text-[9px] uppercase tracking-widest text-light/40 border border-light/20 px-1.5 py-0.5 rounded-full z-10">
                    {ad.badge_text}
                  </span>
                )}
              </div>

              {/* Controls */}
              <div className="flex items-center justify-between px-4 py-3 bg-dark/[0.03]">
                <div>
                  <p className="text-xs font-medium text-dark">{ad.headline}</p>
                  <p className="text-[10px] text-dark/40">Order: {ad.display_order}</p>
                </div>
                <button
                  disabled={toggling === ad.id}
                  onClick={() => toggleActive(ad)}
                  className="flex items-center gap-1.5 text-xs font-medium disabled:opacity-50"
                >
                  {ad.is_active ? (
                    <>
                      <ToggleRight size={20} className="text-emerald-500" />
                      <span className="text-emerald-600">Active</span>
                    </>
                  ) : (
                    <>
                      <ToggleLeft size={20} className="text-dark/30" />
                      <span className="text-dark/40">Off</span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
}

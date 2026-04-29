"use client";

import { motion } from "framer-motion";
import type { ApiAd } from "@/lib/supabase/types";

interface AdBannerProps {
  ad: ApiAd;
}

export default function AdBanner({ ad }: AdBannerProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
      className="mx-4 md:mx-10 my-3 rounded-2xl overflow-hidden relative min-h-[180px] md:min-h-[220px]
                 flex items-center"
    >
      {/* Background */}
      {ad.unsplash_id ? (
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url(https://images.unsplash.com/${ad.unsplash_id}?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=75&w=1400)`,
            filter: "saturate(0.7) contrast(1.0)",
          }}
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-primary to-secondary" />
      )}

      {/* Overlay */}
      <div className="absolute inset-0 bg-primary/75" />

      {/* Texture edge */}
      <div className="absolute inset-0 rounded-2xl shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]" />

      {/* Ad label */}
      {ad.badge_text && (
        <div className="absolute top-4 end-4 z-10">
          <span className="text-[10px] uppercase tracking-widest text-light/30 font-medium border border-light/20 px-2 py-0.5 rounded-full">
            {ad.badge_text}
          </span>
        </div>
      )}

      {/* Content */}
      <div className="relative z-10 px-8 md:px-14 py-10">
        <p className="text-accent/70 text-xs uppercase tracking-[0.2em] font-medium mb-1.5">
          Coming Soon
        </p>
        <h3 className="text-2xl md:text-3xl font-bold text-light tracking-tight mb-1">
          {ad.headline}
        </h3>
        {ad.subtitle && (
          <p className="text-light/55 text-sm">{ad.subtitle}</p>
        )}
      </div>
    </motion.div>
  );
}

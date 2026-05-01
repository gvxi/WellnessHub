"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import type { ApiAd } from "@/lib/supabase/types";
import { resolveImage } from "@/lib/utils";
import { useLang } from "@/lib/lang-context";
import AdLightbox from "./AdLightbox";

interface AdBannerProps {
  ad: ApiAd;
}

function BannerInner({ ad }: { ad: ApiAd }) {
  const { lang } = useLang();
  const isAr = lang === "ar";
  const headline = (isAr && ad.translations?.ar?.headline) ? ad.translations.ar.headline : ad.headline;
  const subtitle = (isAr && ad.translations?.ar?.subtitle) ? ad.translations.ar.subtitle : ad.subtitle;
  const badgeText = (isAr && ad.translations?.ar?.badge_text) ? ad.translations.ar.badge_text : ad.badge_text;
  const imgUrl = resolveImage(ad.image_url, ad.unsplash_id, 1400);

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
      {imgUrl ? (
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url(${imgUrl})`,
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
      {badgeText && (
        <div className="absolute top-4 end-4 z-10">
          <span className="text-[10px] uppercase tracking-widest text-light/30 font-medium border border-light/20 px-2 py-0.5 rounded-full">
            {badgeText}
          </span>
        </div>
      )}

      {/* Content */}
      <div className="relative z-10 px-8 md:px-14 py-10" dir={isAr ? "rtl" : "ltr"}>
        <p className="text-accent/70 text-xs uppercase tracking-[0.2em] font-medium mb-1.5">
          Coming Soon
        </p>
        <h3 className="text-2xl md:text-3xl font-bold text-light tracking-tight mb-1">
          {headline}
        </h3>
        {subtitle && (
          <p className="text-light/55 text-sm">{subtitle}</p>
        )}
      </div>
    </motion.div>
  );
}

export default function AdBanner({ ad }: AdBannerProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false);

  return (
    <>
      {ad.fullscreen_enabled ? (
        <button onClick={() => setLightboxOpen(true)} className="w-full text-left block">
          <BannerInner ad={ad} />
        </button>
      ) : (
        <BannerInner ad={ad} />
      )}
      <AdLightbox ad={ad} open={lightboxOpen} onClose={() => setLightboxOpen(false)} />
    </>
  );
}

"use client";

import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import type { ApiAd } from "@/lib/supabase/types";
import { resolveImage } from "@/lib/utils";
import { useLang } from "@/lib/lang-context";

interface Props {
  ad: ApiAd;
  open: boolean;
  onClose: () => void;
}

export default function AdLightbox({ ad, open, onClose }: Props) {
  const { lang } = useLang();
  const isAr = lang === "ar";
  const headline = (isAr && ad.translations?.ar?.headline) ? ad.translations.ar.headline : ad.headline;
  const subtitle = (isAr && ad.translations?.ar?.subtitle) ? ad.translations.ar.subtitle : ad.subtitle;
  const imgUrl = resolveImage(ad.image_url, ad.unsplash_id, 1400);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="lightbox-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.22 }}
          onClick={onClose}
          className="fixed inset-0 z-[100] bg-dark/90 flex items-center justify-center px-4"
        >
          <motion.div
            key="lightbox-card"
            initial={{ scale: 0.94, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.94, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 28 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl"
          >
            {imgUrl ? (
              <div
                className="min-h-[60vh] bg-cover bg-center"
                style={{ backgroundImage: `url(${imgUrl})` }}
              />
            ) : (
              <div className="min-h-[60vh] bg-gradient-to-br from-primary to-secondary" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-dark/80 via-dark/15 to-transparent flex items-end">
              <div className="px-6 pb-8" dir={isAr ? "rtl" : "ltr"}>
                <h3 className="text-2xl font-bold text-light tracking-tight">{headline}</h3>
                {subtitle && (
                  <p className="text-light/60 text-sm mt-1">{subtitle}</p>
                )}
              </div>
            </div>
            <button
              onClick={onClose}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-dark/40 backdrop-blur-sm flex items-center justify-center"
            >
              <X size={16} className="text-light" />
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
